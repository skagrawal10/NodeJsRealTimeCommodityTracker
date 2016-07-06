import threading
from scrapy.selector import HtmlXPathSelector
import datetime
import os.path
import MySQLdb
import os
import time
import urllib2


class CommoditySpider():
	name = "helloworld"
	
	def __init__(self):
		url = "http://182.18.143.117/mcxbulls/data.aspx";
		response = urllib2.urlopen(url)
		html = response.read()
		self.parse(html)

			
	def database_entry(self,symbol, sellPrice, purPrice, high, low, pcp, date, ltp, open, timest):
		dbcon = MySQLdb.connect(host='localhost', port=3306, user='root', passwd='mathura', db='easysarrafa_server')
		cur = dbcon.cursor();
		valueList = [symbol, sellPrice, purPrice, ltp, high, low, open, pcp, date, timest];
		print valueList;
		cur.execute('INSERT INTO mcxrates (symbol, ask, bid, ltp, high, low, open, pclose, date, time) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)', valueList);
		dbcon.commit();
		dbcon.close();
	

	def parse(self, response):
		hxs = HtmlXPathSelector(text=response)
		os.environ['TZ'] = 'Asia/Calcutta';
		time.tzset();
		now = datetime.datetime.now();
		writeHeader = False;
		date = str(now.year) + "-" + str(now.month) + "-" + str(now.day);
		curtime = str(now.hour) + ":" + str(now.minute) + ":" + str(now.second);
		trs = hxs.select('//table[@id="GridView1"]/tr')
		for tr in trs[1:]:
			tds = tr.select('.//td')
			symbol = ''.join(tds[0].select('.//text()').extract()).strip()
			ltp = ''.join(tds[1].select('.//text()').extract()).strip()
			open = ''.join(tds[2].select('.//text()').extract()).strip()
			high = ''.join(tds[3].select('.//text()').extract()).strip()
			low = ''.join(tds[4].select('.//text()').extract()).strip()
			pclose = ''.join(tds[5].select('.//text()').extract()).strip()
			timest = ''.join(tds[7].select('.//text()').extract()).strip()
			ask = ltp
			bid = ltp
			self.database_entry(symbol, ask, bid, high, low, pclose, date, ltp, open, timest);
		
		
class myThread (threading.Thread):
	def __init__(self):
		threading.Thread.__init__(self)
	def run(self):
		CommoditySpider();
				
if __name__ == '__main__':
	threads = []
	for i in range(6):
		t = myThread();
		t.start();
		threads.append(t);
		time.sleep(10);
	for t in threads:
		t.join();
