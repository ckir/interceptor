import os
import sys
CNN_FearAndGreedUrl = os.getenv('CNN_FEARANDGREEDURL')
GSLoggerUrl = os.getenv('GSLOGGERURL')
if CNN_FearAndGreedUrl is None or GSLoggerUrl is None:
    print("MISSING REQUIRED ENVIRONMENT VARIABLES")
    sys.exit(100)
from logging import exception
import traceback
import datetime
import time
import asyncio
import requests
from requests.adapters import HTTPAdapter, Retry

from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager

from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.events import EventFiringWebDriver, AbstractEventListener
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import TimeoutException

# Inpired from https://github.com/sindresorhus/is-docker
class determineDocker:
    def hasDockerEnv(self):
        try:
            open('/.dockerenv').read()
            return True
        except Exception as e:
            return False
    def  hasDockerCGroup(self):
        try:
            if 'docker' in open('/proc/self/cgroup').read():
                return True
            else:
                return False
            
        except Exception as e:
            return False
    def isDocker(self):
        return self.hasDockerEnv() or self.hasDockerCGroup()

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
        return responce

class MyListener(AbstractEventListener):
    def before_navigate_to(self, url, driver):
        print("Before navigating to ", url)

    def after_navigate_to(self, url, driver):
        print("After navigating to ", url)

    def before_navigate_back(self, driver):
        print("before navigating back ", driver.current_url)

    def after_navigate_back(self, driver):
        print("After navigating back ", driver.current_url)

    def before_navigate_forward(self, driver):
        print("before navigating forward ", driver.current_url)

    def after_navigate_forward(self, driver):
        print("After navigating forward ", driver.current_url)

    def before_find(self, by, value, driver):
        print("before find")

    def after_find(self, by, value, driver):
        print("after_find")

    def before_click(self, element, driver):
        print("before_click")

    def after_click(self, element, driver):
        print("after_click")

    def before_change_value_of(self, element, driver):
        print("before_change_value_of")

    def after_change_value_of(self, element, driver):
        print("after_change_value_of")

    def before_execute_script(self, script, driver):
        print("before_execute_script")

    def after_execute_script(self, script, driver):
        print("after_execute_script")

    def before_close(self, driver):
        print("tttt")

    def after_close(self, driver):
        print("before_close")

    def before_quit(self, driver):
        print("before_quit")

    def after_quit(self, driver):
        print("after_quit")

    def on_exception(self, exception, driver):
        print("on_exception")

gslogger = GSLogger(os.path.basename(__file__), GSLoggerUrl)

heartbeatport = 9999
heartbeat = {
    "port": heartbeatport,
    "pid": os.getpid(),
    "heartbeatinterval": 10000
}
# Send initial request to HTTPWatchdog in case javasript never runs
try:
    payload = {'ts': datetime.datetime.now().isoformat(), 'pid': os.getpid()}
    r = requests.get('http://127.0.0.1:' + heartbeatport, params=payload)
except Exception as e:
    pass

try:
    service = ChromeService(executable_path=ChromeDriverManager().install())
    chromeOptions = webdriver.ChromeOptions()
    # without this we cannot post outside our domain because of CORS policy
    chromeOptions.add_argument("--disable-web-security")
    chromeOptions.add_argument("--incognito")
    if determineDocker().isDocker():
        chromeOptions.add_argument('--no-sandbox')
        chromeOptions.add_argument('--headless')
        chromeOptions.add_argument('--disable-gpu')
        chromeOptions.add_argument('--disable-dev-shm-usage')
        chromeOptions.add_argument("--window-size=1920,1080")
    else:
        chromeOptions.add_argument("--auto-open-devtools-for-tabs")
        chromeOptions.add_argument("--start-maximized")

    # drv = webdriver.Chrome(service=service,options=chromeOptions)
    # driver = EventFiringWebDriver(drv, MyListener())
    driver = webdriver.Chrome(service=service,options=chromeOptions)
    driver.get("https://edition.cnn.com/markets/fear-and-greed")
    driver.set_script_timeout(60 * 60)

    try:
        WebDriverWait(driver, 60).until(EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler"))).click()
    except NoSuchElementException as ex:
        gslogger.GSLog(50, 1, "CNN FEAR AND GREED PAGE CHANGED. REVIEW APP NOW")
        driver.quit()
        sys.exit(99)

    time.sleep(60)
    driver.execute_async_script(open("./interceptor.js").read(), CNN_FearAndGreedUrl, GSLoggerUrl, heartbeat)
    # input("You can't see the next text. (press enter)")

except TimeoutException as tm:
    print("Restarting due to timeout limit")   
except Exception as e:
    exc_info = sys.exc_info()
    exc_info = {'exc_info': ''.join(traceback.format_exception(*exc_info))}
    gslogger.GSLog(50, 0, "Exception ", exc_info)
    time.sleep(5)
finally:
    driver.quit()