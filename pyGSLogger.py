import os
import sys
import argparse
import requests
import asyncio
import json
from requests.adapters import HTTPAdapter, Retry
GSLoggerUrl = os.getenv('GSLOGGERURL')
if GSLoggerUrl is None:
    print("MISSING REQUIRED ENVIRONMENT VARIABLES")
    sys.exit(1)

class GSLogger:
    # default constructor
    def __init__(self, appName, GSLoggerUrl):
        self.appName = appName
        self.GSLoggerUrl = GSLoggerUrl
        self.DEBUG = 10
        self.INFO = 20
        self.WARNING = 30
        self.ERROR = 40
        self.CRITICAL = 50

    def GSLog(self, logLevel, logNotify, logMessage, logExtras = {}):
        asyncio.run(self.GSLogAsync(logLevel, logNotify, logMessage, logExtras))

    async def GSLogAsync(self, logLevel, logNotify, logMessage, logExtras = {}):
        logRecord = {
            "appName": self.appName,
            "logLevel": logLevel,
            "logNotify": logNotify,
            "logMessage": logMessage
        }
        if logExtras:
            logRecord['logExtras'] = logExtras

        s = requests.Session()
        retries = Retry(total=2, backoff_factor=1, status_forcelist=[ 502, 503, 504 ])
        s.mount('https://', HTTPAdapter(max_retries=retries))
        responce = s.post(self.GSLoggerUrl, json = logRecord)
        print ("ok", responce.ok, "statuscode", responce.status_code, "text", responce.text)


parser = argparse.ArgumentParser(description='Command line utility for posting to GSLogger')
parser.add_argument('--appname', required=True, action="store", dest="appName", type=str, help='The application name for the log')
parser.add_argument('--loglevel', required=True, action="store", dest="logLevel", type=int, choices=(10, 20, 30, 40, 50), help='The log level of the log')
parser.add_argument('--lognotify', required=True, action="store", dest="logNotify", type=int, choices=(0, 1), help='Should we get notification')
parser.add_argument('--logmessage', required=True, action="store", dest="logMessage", type=str, help='The log message')
parser.add_argument('--logextras', required=False, action="store", dest="logExtras", type=str, help='A JSON string containing extra data for the log')
args = parser.parse_args()

gslogger = GSLogger(args.appName, GSLoggerUrl)
if args.logExtras:
    try:
        args.logExtras = json.loads(args.logExtras)
    except Exception as jex:
        args.logExtras = {"logExtras": args.logExtras}
else:
    args.logExtras = {}
responce = gslogger.GSLog(args.logLevel, args.logNotify, args.logMessage, args.logExtras)

