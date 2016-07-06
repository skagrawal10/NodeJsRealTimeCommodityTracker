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
		silver_url = "http://www.moneycontrol.com/commodity/silver-price.html";
		response = urllib2.urlopen(silver_url)
		html = response.read()
		self.parse(html, 'SILVER')
		gold_url = "http://www.moneycontrol.com/commodity/gold-price.html";
		response = urllib2.urlopen(gold_url)
		html = response.read()
		self.parse(html, 'GOLD')
		silverm_url = "http://www.moneycontrol.com/commodity/silverm-price.html";
		response = urllib2.urlopen(silverm_url)
		html = response.read()
		self.parse(html, 'SILVERMINI')
		goldm_url = "http://www.moneycontrol.com/commodity/goldm-price.html";
		response = urllib2.urlopen(goldm_url)
		html = response.read()
		self.parse(html, 'GOLDMINI')

			
	def database_entry(self,symbol, sellPrice, purPrice, high, low, pcp, date, ltp, open, curtime):
		dbcon = MySQLdb.connect(host='localhost', port=3306, user='root', passwd='mathura', db='easysarrafa_server')
		cur = dbcon.cursor();
		valueList = [symbol, sellPrice, purPrice, ltp, high, low, open, pcp, date, curtime];
		print valueList;
		cur.execute('INSERT INTO mcxrates (symbol, ask, bid, ltp, high, low, open, pclose, date, time) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)', valueList);
		dbcon.commit();
		dbcon.close();
	
	def zfill(self, val, n):
		new_val = "";
		for i in range(n-len(val)):
			new_val += "0";
		new_val += val
		return new_val

	def parse(self, response, symbol):
		hxs = HtmlXPathSelector(text=response)
		os.environ['TZ'] = 'Asia/Calcutta';
		time.tzset();
		now = datetime.datetime.now() + datetime.timedelta(0,240);
		writeHeader = False;
		date = str(now.year) + "-" + str(now.month) + "-" + str(now.day);
		curtime = self.zfill(str(now.hour), 2) + ":" + self.zfill(str(now.minute), 2) + ":" + self.zfill(str(now.second), 2);
		ltp = hxs.select('//div[@id="commodity_innertab0"]//div[contains(@class, "brdr")]/span/text()').extract()[0].strip();
		change = hxs.select('//div[@id="commodity_innertab0"]//div[contains(@class, "brdr")]/strong/text()').extract()[0].strip();
		pcp = str(float(ltp) - float(change.split('(')[0].strip()))
		low = hxs.select('//div[@id="commodity_innertab0"]//p[contains(@class, "FL")]/text()').extract()[1].strip();
		high = hxs.select('//div[@id="commodity_innertab0"]//p[contains(@class, "FR")]/text()').extract()[1].strip();
		bid = hxs.select('//div[@id="commodity_innertab0"]//div[@class="FL PR20 w135"]/text()').extract()[0].strip();
		ask = hxs.select('//div[@id="commodity_innertab0"]//div[@class="FL PR20 w135"]/text()').extract()[1].strip();
		print date, symbol, ask, bid, high, low, pcp, date, ltp, '0', curtime
		print ltp, change, pcp
		self.database_entry(symbol, ask, bid, high, low, pcp, date, ltp, '0', curtime);
		
		"""
		count = len(rows);
		i=0;
		for row in rows:
			if i!= count-1:
				i = i +1;
				continue;
			columns = row.select("td");
			if len(columns) != 0:
				#print columns;
				#print "Length is " + str(len(columns))
				symbol = columns[0].select("text()").extract()[0].strip();
				expiryMonth = columns[1].select("text()").extract()[0].strip();
				openPrice = columns[3].select("text()").extract()[0].strip();
				highPrice = columns[4].select("text()").extract()[0].strip();
				lowPrice = columns[5].select("text()").extract()[0].strip();
				ltp = columns[6].select("span/text()").extract()[0].strip();
				bid = columns[10].select("text()").extract()[0].strip();
				ask = columns[12].select("text()").extract()[0].strip();
				pcp = columns[7].select("text()").extract()[0].strip();
				print symbol, bid, ask, highPrice, lowPrice, date, ltp;
				self.database_entry(symbol+expiryMonth, ask, bid, highPrice, lowPrice, pcp, date, ltp, openPrice);
				file_path = 'helloworld/spiders/outputData/' + symbol + "_" + expiryMonth + "_" + date;
				if os.path.exists(file_path) == False :
					outFile = open('helloworld/spiders/outputData/' + symbol + "_" + expiryMonth + "_" + date,  'a');
					headerFile = "Symbol=" + symbol + "\tExpiryMonth=" + expiryMonth + "\tOpenPrice=" + openPrice + "\n";
					print headerFile;
					outFile.write(headerFile);
				print symbol, expiryMonth, openPrice, highPrice, lowPrice, ltp;
				outFile = open('helloworld/spiders/outputData/' + symbol + "_" + expiryMonth + "_" + date,  'a');
				outputStr = highPrice + "\t" + lowPrice + "\t" + ltp + "\t" + curtime + "\n"
				outFile.write(outputStr);
				
				#dbcon = MySQLdb.connect(host='localhost', port=3306, user='root', passwd='mathura', db='mcx')
				#cur = dbcon.cursor();
				#valueList = [pcp, symbol, date, expiryMonth];
				#cur.execute('INSERT INTO pcp (pcp, comm, date, expiry) VALUES (%s, %s, %s, %s)', valueList);
				#dbcon.commit();

				outFile.close();
		"""
		
class myThread (threading.Thread):
	def __init__(self):
		threading.Thread.__init__(self)
	def run(self):
		CommoditySpider();
				
if __name__ == '__main__':
	threads = []
	for i in range(30):
		t = myThread();
		t.start();
		threads.append(t);
		time.sleep(2);
	for t in threads:
		t.join();
