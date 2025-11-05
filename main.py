from flask import Flask, redirect
app = Flask(__name__)

@app.route('/')
def index():
    return redirect('http://localhost:9980/loleaflet/dist/loleaflet.html?file_path=file:///tmp/test.ods')

app.run(port=8081)
