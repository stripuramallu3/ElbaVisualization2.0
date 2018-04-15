import os
from datetime import datetime, timedelta
import re
from bs4 import BeautifulSoup, SoupStrainer
import time

global results;

def main():
	global results
	results = getSessionStartEnd()
	mergePitData("RW")
	mergePitData("RO")
	mergeQLengthData("multiplicity", "RO")
	mergeQLengthData("multiplicity", "RW")


def getSessionStartEnd():
	#start_time = time.time()
	pathOrig = os.getcwd()
	os.chdir("results")	
	results = []
	for root, dirs, files in os.walk("."):
		for dir in dirs:
			if "RW" in dir or "RO" in dir:
				pathToResults = os.getcwd()
				os.chdir(dir)
				strainer = SoupStrainer('table')
				soup = BeautifulSoup(open("stat_client0.html"), 'lxml', parse_only=strainer)
				table = str(soup)
				table = table.split("<tr>")
				start = table[3].split("<td>")[2]
				start = start.strip('</td></tr>')
				start = start.strip()
				start = datetime.strptime(start, '%Y-%m-%d %H:%M:%S') + timedelta(hours=2)
				end = table[4].split("<td>")[2]
				end = end.strip('</td></tr>')
				end = end.strip()
				end = datetime.strptime(end,'%Y-%m-%d %H:%M:%S') + timedelta(hours=2)
				one = {}
				one['dir'] = str(dir)
				one['start'] = start.timestamp()
				one['end'] = end.timestamp()
				results.append(one)
				os.chdir(pathToResults)
	os.chdir(pathOrig)
	return results

def mergePitData(config):
	global results
	fname = 'pointtime_'+config+'.tsv'
	header = "workload\ttimestamp\tpit\n"
	fout = open(fname,"w")
	fout.write(header)
	origDir = os.getcwd()
	os.chdir("output")
	for root, dirs, files in os.walk("."):
		for dir in dirs:
			if config in dir:
				start = 0
				end = 0
				for one in results:
					if one['dir'] == str(dir):
						start = int(one['start'])*1000
						end = int(one['end'])*1000
				workload = re.findall('\d+', dir)[0]
				pathToOutput = os.getcwd()
				os.chdir(dir)
				pitFile = open("Pointintime.csv")
				next(pitFile)
				count = 0
				for line in pitFile:
					splitLine  = line.split(",")
					timeStamp = int(splitLine[0])
					if timeStamp >= start and timeStamp <= end:
						fout.write(workload + "\t" + str(count) +  "\t" + splitLine[1])
						count = count + 50
				pitFile.close()
				os.chdir(pathToOutput)
	os.chdir(origDir)
	fout.close()

def mergeQLengthData(metric, config):
	global results
	fname = metric + '_' +  config + '.csv'
	header = "workload,type,date_time,total_http\n"
	fout = open(fname,"w")
	fout.write(header)
	pathToHome = os.getcwd()
	os.chdir("output")
	for root, dirs, files in os.walk("."):
		for dir in dirs:
			pathToOutput = os.getcwd()
			os.chdir(dir)
			for sroot, sdirs, sfiles in os.walk("."):
				for name in sfiles:
					if metric in name:
	   					if config in name:
	   						start = 0
	   						end = 0
	   						for one in results:
	   							if one['dir'] == str(dir):
	   								start = int(one['start'])*1000
	   								end = int(one['end'])*1000
	   						splitName = name.split('_')
	   						serverType = splitName[1]
	   						workload = re.findall('\d+', splitName[3])[0]
		   					datafile = open(name)
		   					next(datafile)
		   					count = 0;
		   					for line in datafile:
		   						splitLine = line.split(",")
		   						timeStamp = float(splitLine[0])*1000
		   						if timeStamp >= start and timeStamp <= end:
			   						fout.write(workload + "," + serverType.lower() + "," + str(count) + ","+ splitLine[len(splitLine) - 1])
			   						count = count + 50
			os.chdir(pathToOutput)
	os.chdir(pathToHome)

main()
