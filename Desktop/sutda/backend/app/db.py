import pymysql

def get_connection():
    return pymysql.connect(
        host="db",
        user="root",
        password="password",
        database="sutda",
        cursorclass=pymysql.cursors.DictCursor
    )