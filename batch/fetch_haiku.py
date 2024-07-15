print("start fetch haiku")
from dataclasses import dataclass
import json
import requests
from bs4 import BeautifulSoup
import time
from selenium import webdriver
import chromedriver_binary

PATH_AUTHOR = "data/author.txt"
PATH_HAIKU = "data/haiku.json"

with open(PATH_AUTHOR, "r", encoding="utf-8") as f:
  authors = f.readlines()

authors = [author.strip() for author in authors]


@dataclass
class Haiku:
  id: str
  content: str
  author: str
  data_from: str

DATA_FROM_HAIKU_DATA_JP = "haiku-data.jp"

haikus:list[Haiku] = []

driver = webdriver.Chrome()

for author in authors:
  print(author)
  url = f"https://haiku-data.jp/author_work_list.php?author_name={author}"
  
  # スクレイピング
  driver.get(url)
  html = driver.page_source
  bsObj = BeautifulSoup(html, 'html.parser')
  haiku_links = bsObj.select("table tbody tr td div a")
  
  for link in haiku_links:
    href = link.get("href")
    if href.startswith("work_detail.php?cd="):
      id = href.replace("work_detail.php?cd=", "")
      content = link.text
      haikus.append({"id": id, "content": content, "author": author, "data_from": DATA_FROM_HAIKU_DATA_JP})
  
  time.sleep(3)

# 取ってきた俳句をjsonに保存
print(haikus)

with open(PATH_HAIKU, 'w') as f:
    json.dump(haikus, f, indent=2)



print("end   fetch haiku")