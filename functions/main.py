import os
from flask import Flask, request, abort, render_template, send_from_directory
import werkzeug

# 環境変数読み込み
ENV = os.environ.get("ENV")
CLIENT_URL  = os.environ.get("CLIENT_URL")
# CORSの設定
RESPONSE_HEADERS = {
  "Access-Control-Allow-Origin": CLIENT_URL
}

app = Flask(__name__)

@app.route('/', methods=["GET", "POST"])
def root():
  print(request)
  return ({"msg": "root"}, 200, RESPONSE_HEADERS)

@app.route('/hello')
def hello():
  print(request)
  return ({"msg": "hello"}, 200, RESPONSE_HEADERS)

def main(request):
  with app.app_context():
    headers = werkzeug.datastructures.Headers()
    for key, value in request.headers.items():
      headers.add(key, value)
    with app.test_request_context(method=request.method, base_url=request.base_url, path=request.path, query_string=request.query_string, headers=headers, data=request.form):
      try:
        rv = app.preprocess_request()
        if rv is None:
          rv = app.dispatch_request()
      except Exception as e:
        rv = app.handle_user_exception(e)
      response = app.make_response(rv)
      return app.process_response(response)