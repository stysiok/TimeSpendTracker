class Website {
    constructor(url, iconUrl, entryTime, exitTime) {
            this.url = url,
            this.iconUrl = iconUrl,
            this.timeArray = new Array(new TimeSpent(entryTime, exitTime))
    }

    get wholeDuration() {
        return this.calcTimeDuration(false);
    }

    calcTimeDuration(format) {
        var result = 0;
        for (var i = 0; i < this.timeArray.length; i++) {
            result += this.timeArray[i].duration;
        }

        return format ? moment(result).utcOffset(0).format("HH:mm:ss") : result;
    }
}

class TimeSpent {
    constructor(entryTime, exitTime) {
        this.entryTime = entryTime,
            this.exitTime = exitTime
    }

    get duration() {
        return this.calcDuration();
    }

    calcDuration(format) {
        var entry = moment(this.entryTime, "HH:mm:ss");
        var exit = moment(this.exitTime, "HH:mm:ss");

        return exit.diff(entry);
    }
}

var uniqueUrls = [];
var websites = [];
var currentWebsite;
var urlRegex = /[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/;

//--Chrome Extension section
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tab.status !== "complete" || !tab.active || changeInfo.status === undefined)
        return;

    console.log(`Tab has been updated`);
    console.log(tab);
    tabChangedOrUpdated(tab);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    if (activeInfo.tabId == "")
        return;

    getCurrentSelectedTab(activeInfo.tabId);
});

function getCurrentSelectedTab(tabId) {
    if(tabId == null)
        return;

    chrome.tabs.get(tabId, function (tab) {
        if(tab == null || tab.status !== "complete" || !tab.active)
            return;
        
        console.log(`selected tab has changed`);
        console.log(tab);
        tabChangedOrUpdated(tab);
    });
}

//--functions of URLs
function urlParser(url) {
    var element = document.createElement('a');
    element.href = url;

    return element.hostname;
}

//--add new website or time to website to website array
function tabChangedOrUpdated(tab) {
    if(tab == null)
        return;
    
    var parsedUrl = urlParser(tab.url);
    var isBadUrl = !urlRegex.test(parsedUrl);

    if (isBadUrl && currentWebsite == null) {
        return;
    }
    else if (currentWebsite == null) {
        currentWebsite = new Website(parsedUrl, tab.favIconUrl, getCurrentTime(), null);
        return;
    }
    else if (currentWebsite.url === parsedUrl) {
        return;
    }

    addWebsiteToWebsites();


    currentWebsite = isBadUrl ? null : new Website(parsedUrl, tab.favIconUrl, getCurrentTime(), null);
}

function addWebsiteToWebsites(){
    currentWebsite.timeArray[0].exitTime = getCurrentTime();

    if (uniqueUrls.indexOf(currentWebsite.url) === -1) {
        uniqueUrls.push(currentWebsite.url);
        websites.push(currentWebsite);
    } else {
        addTimeToExisingWebsite();
    }
}

function addTimeToExisingWebsite() {
    var index = websites.findIndex(element => element.url == currentWebsite.url);

    if (index === -1) {
        console.log("coś poszło nie tak przy sprawdzaniu czy strona istnieje w bazie");
        return;
    }

    var timeTracked = new TimeSpent(currentWebsite.timeArray[0].entryTime, currentWebsite.timeArray[0].exitTime);
    websites[index].timeArray.push(timeTracked);
}

//--saving and getting data
//https://developer.chrome.com/extensions/storage
//http://julip.co/2010/01/how-to-build-a-chrome-extension-part-2-options-and-localstorage/
chrome.windows.onRemoved.addListener(function (windowId) {
    chrome.windows.getAll(function (windows) {
        if (windows.length != 0)
           return;

        if(currentWebsite != null)
            addWebsiteToWebsites();
        
        currentWebsite = null;
        console.log(websites);

        var key = moment().format("DD/MM/YYYY");
        
        getDataFromStorage(key);

        //saveDataToStorage(key);
    })
});

function getDataFromStorage(key) {
    chrome.storage.sync.get([key], function (items) {
        if(items == null)
            return;
        
        var toMap = [];
        console.log(items);
        var tItems = items[key];

        for (var i = 0; i < tItems.length; i++) {
            var index = websites.findIndex(element => element.url == tItems[i].url);

            if (index !== -1) {
                var times = tItems[i].timeArray;
                for (var j = 0; j < times.length; j++) {
                    //needs to be sorted bcs time will be ealier than current time
                    websites[index].timeArray.push(new TimeSpent(times[j].entryTime, times[j].exitTime));
                }

                websites[index].timeArray.sort((obj1, obj2) => obj1.entryTime > obj2.entryTime);
            }
            else {
                toMap.push(tItems[i]);
            }
        }

        if (toMap.length != 0) {
            websites = websites.concat(mapItemsToWebsites(toMap));
        }

        console.log(key);
        saveDataToStorage(key);
    });
}

function saveDataToStorage(key) {
    var obj = {
        [key]: websites
    };
    console.log(obj);

    chrome.storage.sync.set(obj, function () {
        console.log("Saved data");
        websites = [];
        uniqueUrls = [];
    });
}


//temporary solution - need to think how to implement a better constructor for website class
var mapItemsToWebsites = (items) => {
    var mapedWebsites = [];
    for (var i = 0; i < items.length; i++) {
        var temp = items[i];
        var website = new Website(temp.url, temp.iconUrl, temp.timeArray[0].entryTime, temp.timeArray[0].exitTime);

        if(temp.timeArray.length > 1){
            for (var j = 1; j < temp.timeArray.length; j++) {
                var tempTS = new TimeSpent(temp.timeArray[j].entryTime, temp.timeArray[j].exitTime);
                website.timeArray.push(tempTS);
            }
        }

        mapedWebsites.push(website);
    }

    return mapedWebsites;
}

//-- additional MomentJS functions
function getCurrentTime() {
    return moment().format("HH:mm:ss");
}

function parseToHHmmss(value) {
    return moment(value).utcOffset(0).format("HH:mm:ss");
}

//--Checking functions & Tests
function logTimeForWebsite(index) {
    var result = websites[index].calcTimeSpend();
    return parseToHHmmss(result);
}

function logTimeForAllWebsites() {
    var arr = [];
    for (var i = 0; i < websites.length; i++) {
        var timeS = logTimeForAllWebsites(i);

        var obj = {
            url: websites[i].url,
            time: timeS
        };

        arr.push(obj);
    }
    console.log(arr);
}

function mapItemsToWebsiteObjectsTest() {
    var obj1 = {
        url: "das",
        iconUrl: "123",
        timeArray: [
            {
                entryTime: "12:12:12",
                exitTime: "12:32:12"

            },
            {
                entryTime: "12:33:33",
                exitTime: "14:12:32"

            }
        ]
    }
    var obj2 = {
        url: "da321s",
        iconUrl: "112312323",
        timeArray: [
            {
                entryTime: "12:12:12",
                exitTime: "12:32:12"

            },
            {
                entryTime: "12:33:33",
                exitTime: "14:12:32"

            }
        ]
    }
    var obj3 = {
        url: "das12",
        iconUrl: "112312312323",
        timeArray: [
            {
                entryTime: "12:12:12",
                exitTime: "12:32:12"

            },
            {
                entryTime: "12:33:33",
                exitTime: "14:12:32"

            }
        ]
    }

    var objs = [obj1, obj2, obj3];

    var mapped = mapItemsToWebsites(objs);
    console.log(objs);
    console.log(mapped);
}