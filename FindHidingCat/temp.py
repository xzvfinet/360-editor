from flask import Flask, render_template, send_file
from flask_cors import CORS, cross_origin

app = Flask(__name__)
CORS(app)

@app.route("/findcat")
def hello():
	return render_template('main.html')
@app.route("/img")
def image():
        return send_file('static/img/cat02.png')
@app.route("/sound")
def sound():
	return send_file('static/se/sfx-lightbulb.wav')

if __name__ == "__main__":
	app.run(host='0.0.0.0', port=8080)
