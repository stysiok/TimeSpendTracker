class Website {
    constructor(url, iconUrl, date, entryTime, exitTime) {
        this.url = url,
            this.iconUrl = iconUrl,
            this.date = date,
            this.entryTime = entryTime,
            this.exitTime = exitTime
    }

    get duration() {
        return this.calcDuration(true);
    }

    calcDuration(format) {
        var entry = moment(this.entryTime, "HH:mm:ss");
        var exit = moment(this.exitTime, "HH:mm:ss");

        var result = exit.diff(entry);

        return format ? moment(result).utcOffset(0).format("HH:mm:ss") : result;
    }
}

var uniqueUrls = [];
var websites = [];
var currentWebsite;
var urlRegex = /[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/;
var connectionString = "TimeTrackerDB";
var db;

//--Chrome Extension section
chrome.windows.onCreated.addListener(function () {
    openDatabaseConnection();
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tab.status !== "complete" || !tab.active || changeInfo.status === undefined)
        return;

    consoleLogHandler("TAB EVENT!!!", "Tab has been updated", tab);

    tabChangedOrUpdated(tab);
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {      
    chrome.tabs.query({}, function (result) {
        if (result.length != 0)
            return;

        if (currentWebsite == null)
            return;

        saveData();
    });
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    if (activeInfo.tabId == "" || activeInfo.tabId == undefined)
        return;

    getCurrentSelectedTab(activeInfo.tabId);
});

function getCurrentSelectedTab(tabId) {
    if (tabId == null)
        return;

    chrome.tabs.get(tabId, function (tab) {
        if (tab == undefined || tab.status !== "complete" || !tab.active)
            return;

        consoleLogHandler("TAB EVENT!!!", "Selected tab has been changed", tab);

        tabChangedOrUpdated(tab);
    });
}

//--functions of URLs
function urlParser(url) {
    var element = document.createElement('a');
    element.href = url;

    return element.hostname;
}

//--add new website to current websites
function tabChangedOrUpdated(tab) {
    if (tab == null)
        return;

    var parsedUrl = urlParser(tab.url);
    var isBadUrl = !urlRegex.test(parsedUrl);

    if (isBadUrl && currentWebsite == null) {
        return;
    } else if (currentWebsite == null) {
        currentWebsite = new Website(parsedUrl, tab.favIconUrl, moment().format("DD/MM/YYYY"), getCurrentTime(), null);
        return;
    } else if (currentWebsite.url === parsedUrl) {
        return;
    }

    saveData();
    uniqueUrls.push(currentWebsite.url);
    websites.push(currentWebsite);


    currentWebsite = isBadUrl ? null : new Website(parsedUrl, tab.favIconUrl, moment().format("DD/MM/YYYY"), getCurrentTime(), null);
}

//--Database
function openDatabaseConnection() {
    db = new Dexie(connectionString);
    db.version(1).stores({
        websites: '++id, url, iconUrl, date, entryTime, exitTime'
    });

    db.open().catch(function (error) {
        consoleLogHandler("DB ERROR!!!", "Error while creating connection with the database", error);
    });
}

function saveData() {
    openDatabaseConnection();

    currentWebsite.exitTime = getCurrentTime();

    db.websites.add({
        url: currentWebsite.url,
        iconUrl: currentWebsite.iconUrl,
        date: currentWebsite.date,
        entryTime: currentWebsite.entryTime,
        exitTime: currentWebsite.exitTime
    }).then(function (result) {
        consoleLogHandler("ADD SUCCESSFUL!!!", "Adding data to the database has been successful", result);
    }).catch(function (error) {
        console.group("DB ADD ERROR!!!");
        console.log(`Error while adding data to the database`);
        console.log(error);
        console.groupEnd();
    });
}

//temporary solution - need to think how to implement a better constructor for website class
var mapItemsToWebsites = (items) => {
    var mapedWebsites = [];
    for (var i = 0; i < items.length; i++) {
        var temp = items[i];
        var website = new Website(temp.url, temp.iconUrl, temp.timeArray[0].entryTime, temp.timeArray[0].exitTime);

        if (temp.timeArray.length > 1) {
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
        timeArray: [{
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
        timeArray: [{
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
        timeArray: [{
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

//--console log extension
function consoleLogHandler(title, message, data) {
    console.group(title);
    console.log(message);
    console.log(data);
    console.groupEnd();
}