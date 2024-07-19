import contextlib

import os
import random
from agraffe import Agraffe
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import firestore
from dataclasses import dataclass
from pydantic import BaseModel
from typing import Union
from transformers import BertJapaneseTokenizer, BertModel
import pandas as pd
import torch
from torch import Tensor

from modules import firestore_util
from modules import storage_util

#############################設定#############################
@contextlib.asynccontextmanager
async def lifespan(app):
    yield {'message': 'hello'}

app = FastAPI(lifespan=lifespan)

# 環境変数読み込み
ENV = os.environ.get("ENV")
CLIENT_URL  = os.environ.get("CLIENT_URL")
# CORSの設定
app.add_middleware(
  CORSMiddleware,
  allow_origins=[CLIENT_URL],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

#############################ルーティング#############################
@app.get("/init")
def init():
  haikus = firestore_util.run_transaction([fetch_random_haikus])
  return {"haikus": haikus}

class Simple_Haiku(BaseModel):
  id: Union[str, None]
  content: str

class SuggestParams(BaseModel):
  selected_haikus: list[Simple_Haiku]

@app.post("/suggest")
def suggest(params: SuggestParams):
  suggested_haikus = firestore_util.run_transaction([lambda tran: suggest_haikus(tran, params.selected_haikus)])
  return {"suggested_haikus": suggested_haikus}

# TODO: search処理
@app.get("/search")
def search(word: str = ""):
  searched_haikus = firestore_util.run_transaction([lambda tran: search_haikus(tran, word)])
  return {"searched_haikus": searched_haikus}


#############################諸々の処理#############################
@dataclass
class Haikus(firestore_util.Firestore_Dict):
  id: str
  content: str
  author: str
  data_from: str

def fetch_random_haikus(transaction:firestore.firestore.Transaction):
  # ランダムにn個の俳句をDBから取得して返す
  haikus:list[Haikus] = firestore_util.select_firestore(transaction, "m_haiku")
  init_haikus_count = 10
  return random.sample(haikus, init_haikus_count)

def search_haikus(transaction:firestore.firestore.Transaction, word:str):
  all_haikus:list[Haikus] = firestore_util.select_firestore(transaction, "m_haiku")
  replaced_word = word.replace(' ', '').replace('　', '').replace('__BR__', '').replace('\n', "").replace('\xa0', '').replace('\r', '').strip()
  searched_haikus = [
    haiku for haiku in all_haikus
    if replaced_word in haiku["content"] or replaced_word in haiku["author"]
  ]
  return searched_haikus

def suggest_haikus(transaction:firestore.firestore.Transaction, selected_haikus: list[Simple_Haiku]):
  # サジェスター作る
  haiku_suggester = Haiku_Suggester()

  # idある俳句は計算済みのvectorを取ってくる
  # idない俳句は自前で計算
  selected_haiku_vectors:list[Tensor] = [
    haiku_suggester.get_haiku_vectors(selected_haiku.id) if selected_haiku.id is not None else haiku_suggester.text_to_vector(selected_haiku.content)
    for selected_haiku in selected_haikus
  ]

  # vector列から、selectedHaikusにあるidを除外
  selected_haiku_ids = [selected_haiku.id for selected_haiku in selected_haikus if selected_haiku.id is not None]
  haiku_suggester.delete_selected_haiku(selected_haiku_ids)

  # cos類似度上位n件のidを取ってくる
  count = 30
  suggested_ids = haiku_suggester.get_similar_haiku_ids(selected_haiku_vectors, count)

  # suggested_idsを元にfirestoreからselect
  return firestore_util.select_firestore(transaction, "m_haiku", "id", "in", suggested_ids)

class Haiku_Suggester:
  model: BertModel
  tokenizer: BertJapaneseTokenizer
  haiku_vectors: pd.DataFrame
  max_length: int

  def __init__(self):
    self.max_length = 256

    # storageから持ってくる
    self.model = storage_util.open_file("model.pkl")
    self.tokenizer = storage_util.open_file("tokenizer.pkl")
    self.haiku_vectors = storage_util.open_file("haiku_vector.pkl")
  
  def get_haiku_vectors(self, id:str) -> Tensor:
    return torch.tensor(self.haiku_vectors.loc[self.haiku_vectors["id"] == id]["content_vector"].to_list()[0])
  
  def delete_selected_haiku(self, ids:list[str]) -> None:
    self.haiku_vectors = self.haiku_vectors[self.haiku_vectors["id"].isin(ids) == False]
    
  def text_to_vector(self, text:str) -> Tensor:
    encoding = self.tokenizer(
      text,
      max_length = self.max_length,
      padding = 'max_length',
      truncation = True,
      return_tensors = 'pt'
    )
    encoding = {k: v.to(torch.device("cpu")) for k, v in encoding.items()}
    attention_mask = encoding['attention_mask']

    #文章ベクトルを計算
    with torch.no_grad():
      output = self.model(**encoding)
      last_hidden_state = output.last_hidden_state
      averaged_hidden_state =(last_hidden_state*attention_mask.unsqueeze(-1)).sum(1)/attention_mask.sum(1,keepdim=True) 

    return averaged_hidden_state
  
  def calc_similarity(self, selected_haiku_vectors: list[Tensor]):
    def ret_func(target: list[list[float]]):
      similarities:list[float] = [torch.nn.functional.cosine_similarity(haiku_vector, torch.tensor(target), dim=1).detach().numpy().copy()[0] for haiku_vector in selected_haiku_vectors]
      return sum(similarities) / len(similarities)
    return ret_func
  
  def get_similar_haiku_ids(self, selected_haiku_vectors: list[Tensor], count:int = 10) -> list[str]:
    calc = self.calc_similarity(selected_haiku_vectors)
    self.haiku_vectors["similarity"] = self.haiku_vectors["content_vector"].apply(calc)
    
    df_result = self.haiku_vectors.sort_values('similarity', ascending=False).head(count)

    return df_result["id"].tolist()




entry_point = Agraffe.entry_point(app)