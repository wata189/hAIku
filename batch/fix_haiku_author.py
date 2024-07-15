print("start fix haiku author")

import pandas as pd
import firebase_admin
from firebase_admin import firestore
from dataclasses import dataclass
from typing import Callable, Union

from modules import firestore_util






@dataclass
class Fix_Haiku:
  id: str
  author: str
  update_user_id: Union[str, None]

user_id = "batch fix haiku author"
fix_haikus:list[Fix_Haiku] = [
  {"id": "12844", "author": "尾池和夫", "update_user_id": user_id},
  {"id": "12843", "author": "尾池和夫", "update_user_id": user_id},
  {"id": "12845", "author": "尾池和夫", "update_user_id": user_id},

  {"id": "19731", "author": "菅原和子", "update_user_id": user_id},
  {"id": "19732", "author": "菅原和子", "update_user_id": user_id},
  {"id": "19733", "author": "菅原和子", "update_user_id": user_id},
  {"id": "19734", "author": "菅原和子", "update_user_id": user_id},
  {"id": "19735", "author": "菅原和子", "update_user_id": user_id},

  {"id": "35091", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35096", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35086", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35093", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35095", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35098", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35081", "author": "田中悦子", "update_user_id": user_id},
  {"id": "23904", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35090", "author": "田中悦子", "update_user_id": user_id},
  {"id": "23905", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35094", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35088", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35087", "author": "田中悦子", "update_user_id": user_id},
  {"id": "23903", "author": "田中悦子", "update_user_id": user_id},
  {"id": "23907", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35089", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35099", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35085", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35084", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35082", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35097", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35092", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35083", "author": "田中悦子", "update_user_id": user_id},
  {"id": "35100", "author": "田中悦子", "update_user_id": user_id},

  {"id": "27932", "author": "森武子", "update_user_id": user_id},
  {"id": "27935", "author": "森武子", "update_user_id": user_id},
  {"id": "27933", "author": "森武子", "update_user_id": user_id},
  {"id": "27934", "author": "森武子", "update_user_id": user_id},
  {"id": "27936", "author": "森武子", "update_user_id": user_id},
  
  {"id": "21026", "author": "山本美紗", "update_user_id": user_id},
  {"id": "21025", "author": "山本美紗", "update_user_id": user_id},
  {"id": "21024", "author": "山本美紗", "update_user_id": user_id},
  {"id": "21022", "author": "山本美紗", "update_user_id": user_id},
  {"id": "21023", "author": "山本美紗", "update_user_id": user_id},

  {"id": "27989", "author": "山本美枝", "update_user_id": user_id},
  {"id": "27987", "author": "山本美枝", "update_user_id": user_id},
  {"id": "27988", "author": "山本美枝", "update_user_id": user_id},
  {"id": "27990", "author": "山本美枝", "update_user_id": user_id},
  {"id": "27991", "author": "山本美枝", "update_user_id": user_id}
]

def fix_author(transaction: firestore.firestore.Transaction):
  fix_bulk_documents:firestore_util.Bulk_Document = [
    firestore_util.Bulk_Document(haiku["id"], haiku)
    for haiku in fix_haikus
  ]
  firestore_util.update_bulk_firestore(transaction, "m_haiku", fix_bulk_documents)

def confirm(transaction: firestore.firestore.Transaction):
  result = firestore_util.select_firestore(transaction, "m_haiku", "id", "==", "12844")
  print(result)

firestore_util.run_transaction([fix_author])
firestore_util.run_transaction([confirm])


print("end   fix haiku author")