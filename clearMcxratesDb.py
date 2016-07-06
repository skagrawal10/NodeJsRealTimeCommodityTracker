import threading
from scrapy.selector import HtmlXPathSelector
import datetime
import os.path
import MySQLdb
import os
import time
import urllib2
import json


def clearDB():
	dbcon = MySQLdb.connect(host='localhost', port=3306, user='root', passwd='mathura', db='easysarrafa_server')
	cur = dbcon.cursor();
	cur.execute("select max(id)-100 from mcxrates")
	maxid = cur.fetchone()
	cur.execute('delete from mcxrates where id < '+str(maxid[0]));
	dbcon.commit();
	dbcon.close();
	
				
if __name__ == '__main__':
	clearDB()
