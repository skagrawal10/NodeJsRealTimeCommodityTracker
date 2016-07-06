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
	baseURL = "http://www.mcxindia.com/sitepages/MarketWatch.aspx?mwtype=1&pageno=0&symbol=%s&exp=&shortby=&shortdir=ASC&isrefreshed=0&etype=GO"
	
	
	def __init__(self):
		f = open('helloworld/spiders/commodityConfig.txt', 'r');
		lines = f.read().split('\n');
		for line in lines:
			words = line.split(' ');
			if words[0].strip() == '':
				continue
			url = self.baseURL % words[0];
			response = urllib2.urlopen(url)
			html = response.read()
			self.parse(html)
	
			
	def database_entry(self,symbol, sellPrice, purPrice, high, low, pcp, date, ltp, open):
		dbcon = MySQLdb.connect(host='localhost', port=3306, user='root', passwd='mathura', db='easysarrafa_server')
		cur = dbcon.cursor();
		valueList = [symbol, sellPrice, purPrice, ltp, high, low, open, pcp, date];
		print valueList;
		cur.execute('INSERT INTO mcxrates (symbol, ask, bid, ltp, high, low, open, pclose, date) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)', valueList);
		dbcon.commit();
		dbcon.close();
	

	def parse(self, response):
		hxs = HtmlXPathSelector(text=response)
		os.environ['TZ'] = 'Asia/Calcutta';
		time.tzset();
		now = datetime.datetime.now();
		writeHeader = False;
		print str(10);
		date = str(now.year) + "-" + str(now.month) + "-" + str(now.day);
		curtime = str(now.hour) + ":" + str(now.minute) + ":" + str(now.second);
		print "Hi !! Response is received"
		rows = hxs.select("//table[@id='gvMWatchToday']/tr");
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
