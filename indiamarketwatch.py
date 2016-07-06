import threading
from scrapy.selector import HtmlXPathSelector
import datetime
import os.path
import MySQLdb
import os
import time
import urllib2
import json


class CommoditySpider():
	name = "helloworld"
	
	def __init__(self):
		url = "http://www.indiamarketwatch.com/IndiaMarketWatch/M1/JSON2x3/JSONMobile.aspx?username=muskan241&ScriptView=Standard"
		response = urllib2.urlopen(url, timeout=5)
		html = response.read()
		self.parse(html)
			
	def database_entry(self,symbol, sellPrice, purPrice, high, low, pcp, date, ltp, open, curtime):
		dbcon = MySQLdb.connect(host='localhost', port=3306, user='root', passwd='mathura', db='easysarrafa_server')
		cur = dbcon.cursor();
		valueList = [symbol, sellPrice, purPrice, ltp, high, low, open, pcp, date, curtime];
		#print valueList;
		cur.execute('INSERT INTO mcxrates (symbol, ask, bid, ltp, high, low, open, pclose, date, time) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)', valueList);
		dbcon.commit();
		dbcon.close();
	
	def zfill(self, val, n):
		new_val = "";
		for i in range(n-len(val)):
			new_val += "0";
		new_val += val
		return new_val

	def parse(self, response):
		hxs = HtmlXPathSelector(text=response)
		os.environ['TZ'] = 'Asia/Calcutta';
		time.tzset();
		now = datetime.datetime.now() + datetime.timedelta(0,240);
		writeHeader = False;

		obj = json.loads(response)
		date = str(now.year) + "-" + str(now.month) + "-" + str(now.day);
		curtime = obj["datetime"]
		
		for d in obj["AllRows"]:
			symbol = d["SymbolName"]
			if symbol[:4] == "GOLD":
				if symbol == "GOLDM":
					symbol = "GOLDMINI"
				elif symbol == "GOLDAPR":
					symbol = "GOLD"
			elif symbol[:6] == "SILVER":
				if symbol == "SILVERMAY":
					symbol = "SILVER"
				elif symbol == "SILVERM":
					symbol = "SILVERMINI"
			else:
				symbol = ""
			
			if len(symbol) > 0:
				ltp = d["MyColumn"][0]["Value"]
				bid = d["MyColumn"][1]["Value"]
				ask = d["MyColumn"][2]["Value"]
				low = d["MyColumn"][3]["Value"]
				high = d["MyColumn"][4]["Value"]
				pcp = d["MyColumn"][5]["Value"]
				
				#print date, symbol, ask, bid, high, low, pcp, date, ltp, '0', curtime
				#print ltp, change, pcp
				self.database_entry(symbol, ask, bid, high, low, pcp, date, ltp, '0', curtime);

		
class myThread (threading.Thread):
	def __init__(self):
		threading.Thread.__init__(self)
	def run(self):
		CommoditySpider();
				
if __name__ == '__main__':
	threads = []
	for i in range(60):
		t = myThread();
		t.start();
		threads.append(t);
		time.sleep(1);
	for t in threads:
		t.join();
