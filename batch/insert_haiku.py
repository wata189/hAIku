print("start insert haiku")
import sys
import json
import time
from firebase_admin import firestore
from dataclasses import dataclass
from typing import Union
import os
from pathlib import Path

from modules import firestore_util

# dataフォルダの中で最新のファイルを最新のjsonとして指定
p = Path("data")
files = list(p.glob("*"))
file_updates = {file_path: os.stat(file_path).st_mtime for file_path in files}
newst_file_path = max(file_updates, key=file_updates.get)
print(newst_file_path)
PATH_HAIKU = newst_file_path

PATH_REST_HAIKU = "data/rest_haiku_"

@dataclass
class Haiku:
  id: str
  content: str
  author: str
  data_from: str
  create_user_id: Union[str, None]
  update_user_id: Union[str, None]



with open(PATH_HAIKU) as f:
  haikus:list[Haiku] = json.load(f)

# 一度のトランザクションで500件までしか送信できないのである程度絞る
count = 490
rest_haikus = haikus[count:]
haikus = haikus[:count]


user_id = "batch insert haiku"
bulk_add_haikus:list[firestore_util.Bulk_Add_Document] = []
for haiku in haikus:
  haiku["create_user_id"] = user_id
  haiku["update_user_id"] = user_id
  bulk_add_haikus.append(firestore_util.Bulk_Add_Document(haiku["id"], haiku))

collection_path = "m_haiku"

def insert_haiku(transaction: firestore.firestore.Transaction):
  # bulkinsert
  firestore_util.add_bulk_firestore(transaction, collection_path, bulk_add_haikus)


firestore_util.run_transaction([insert_haiku])

# rest_haikusを保存
path = PATH_REST_HAIKU + str(round(time.time())) + ".json"
with open(path, "w") as f:
  json.dump(rest_haikus, f, indent=2)

def get_count(transaction: firestore.firestore.Transaction):
  all_haikus = firestore_util.select_firestore(transaction, collection_path)
  print("haiku count: " + str(len(all_haikus)))
firestore_util.run_transaction([get_count])

print("end   insert haiku")