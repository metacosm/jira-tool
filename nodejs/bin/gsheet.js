#!/usr/bin/env node
/*
 * src: https://developers.google.com/sheets/api/quickstart/nodejs
 * REQUIRES: NODE.JS version 12
*/
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const args = process.argv;

let util = require('../lib/util.js')
let operation = require('../lib/operations.js')
let program = require('commander')
var cli
// Instantiate JIRA Client using command line parameters
var cfg = util.parseJIRAConfig()
//cli = operation.newClient(cfg.host.name, cfg.host.user, cfg.host.pwd)

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = require('os').homedir() + '/.goog-dev/.token.json';
const SHEET_NAME='CVE';
const URL_PATTERN = /^https?:\/\/(?<domain>[^/?#]+)[/?#](?<params>[a-zA-Z0-9_/-]+)/gi;


if (process.argv.length != 3) {
  printUsage();
} else {
  if ('--help' == process.argv[0]) {
    printUsage();
  }
}

gsheet_id=process.argv[2]

// Load client secrets from a local file.
fs.readFile(require('os').homedir() + '/.goog-dev/.credentials_node.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), reviewGsheet);
});



/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function reviewGsheet(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: gsheet_id,
    range: SHEET_NAME + '!A2:H',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      rowNum=0;
      rows.map((row) => {
        rowNum++;
    try {
          processRow(sheets, row[0], row[1], row[4], row[5], row[7], rowNum)
    } catch (e) {
    console.log(`Unable to get JIRA issue - Status code of error is:\nutil{e} ${e}`)
    }
      });
    } else {
      console.log('No data found.');
    }
  });
}

/**
 * Process a row of the GSheet document.
*/
function processRow(sheets, id, cve, bzIssueUrl, rhIssueUrl, bomRelease, rowNum) {
  console.log('#processRow(...)');
  console.log('  -> id: ' + id);
  console.log('  -> cve: ' + cve);
  console.log('  -> bzIssueUrl: ' + bzIssueUrl);
  console.log('  -> rhIssueUrl: ' + rhIssueUrl);
  console.log('  -> bomRelease: ' + bomRelease);
  console.log('  -> rowNum: ' + rowNum);

  if (typeof rhIssueUrl == 'undefined' || rhIssueUrl.length == 0) {
    cli = operation.newClient(cfg.host.name, cfg.host.user, cfg.host.pwd)
    var queryDict = {  }
    queryDict.jql = 'project = "ENTSBT" and summary = "' + cve + '"';
    var issuesQueryResJson = operation.QueryIssues(cli, queryDict);
    var issuesQueryResJsonObj = JSON.parse(issuesQueryResJson);
    issueId = issuesQueryResJsonObj.key;
    rhIssueUrl = `https://issues.redhat.com/browse/${issuesQueryResJsonObj.key}`;
    let values = [
      [
        issuesQueryResJsonObj.key
      ],
    ];
    let resource = {
      values,
    };
    updateGsheetCell('F', rowNum, values);
  } else {
    let [, domain, params] = URL_PATTERN.exec(rhIssueUrl) || [];
    console.log(`domain: ${domain}`)
    console.log(`params: ${params}`)
    var paramArr = params.split("/");
    issueId = paramArr[paramArr.length - 1]
    console.log(`issueId: ${issueId}`)
    cli = operation.newClient(domain, cfg.host.user, cfg.host.pwd)
    issueJson = operation.GetIssueById(cli, issueId)
    console.log(`### e: ${e}`)
    const MY_JSON='{"expand":"renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations","id":"12770724","self":"https://issues.jboss.org/rest/api/latest/issue/12770724","key":"SB-889","fields":{"issuetype":{"self":"https://issues.jboss.org/rest/api/2/issuetype/13","id":"13","description":"An enhancement or refactoring of existing functionality","iconUrl":"https://issues.jboss.org/secure/viewavatar?size=xsmall&avatarId=13269&avatarType=issuetype","name":"Enhancement","subtask":false,"avatarId":13269},"timespent":null,"project":{"self":"https://issues.jboss.org/rest/api/2/project/12319021","id":"12319021","key":"SB","name":"Spring Boot & Cloud","avatarUrls":{"48x48":"https://issues.jboss.org/secure/projectavatar?avatarId=17263","24x24":"https://issues.jboss.org/secure/projectavatar?size=small&avatarId=17263","16x16":"https://issues.jboss.org/secure/projectavatar?size=xsmall&avatarId=17263","32x32":"https://issues.jboss.org/secure/projectavatar?size=medium&avatarId=17263"},"projectCategory":{"self":"https://issues.jboss.org/rest/api/2/projectCategory/10110","id":"10110","description":"Cloud-related Projects","name":"j) Cloud"}},"fixVersions":[],"aggregatetimespent":null,"resolution":null,"customfield_12310220":null,"customfield_12310341":null,"customfield_12310340":null,"customfield_12312640":null,"resolutiondate":null,"workratio":-1,"customfield_12310940":null,"lastViewed":"2018-09-21T01:27:54.798-0400","watches":{"self":"https://issues.jboss.org/rest/api/2/issue/SB-889/watchers","watchCount":1,"isWatching":true},"created":"2018-09-21T01:26:28.000-0400","customfield_12313140":null,"priority":{"self":"https://issues.jboss.org/rest/api/2/priority/3","iconUrl":"https://issues.jboss.org/images/icons/priorities/major.svg","name":"Major","id":"3"},"labels":[],"customfield_12311244":null,"customfield_12311640":null,"customfield_12311245":null,"customfield_12311641":null,"customfield_12311242":null,"customfield_12311243":null,"customfield_12311240":null,"timeestimate":null,"aggregatetimeoriginalestimate":null,"versions":[],"customfield_12311241":null,"customfield_12310031":null,"customfield_12313340":null,"issuelinks":[],"assignee":{"self":"https://issues.jboss.org/rest/api/2/user?username=cmoulliard","name":"cmoulliard","key":"cmoulliard","emailAddress":"cmoulliard@redhat.com","avatarUrls":{"48x48":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=48","24x24":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=24","16x16":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=16","32x32":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=32"},"displayName":"Charles Moulliard","active":true,"timeZone":"Europe/Berlin"},"updated":"2018-09-21T01:27:55.000-0400","customfield_12311246":null,"customfield_12311840":null,"customfield_12313942":null,"customfield_12313941":null,"status":{"self":"https://issues.jboss.org/rest/api/2/status/10016","description":"The issue is new, waiting for triage or approve","iconUrl":"https://issues.jboss.org/images/icons/statuses/generic.png","name":"New","id":"10016","statusCategory":{"self":"https://issues.jboss.org/rest/api/2/statuscategory/2","id":2,"key":"new","colorName":"blue-gray","name":"To Do"}},"components":[],"timeoriginalestimate":null,"customfield_12310080":null,"description":"I would like to proposition to adapt the screen of \\"start.snowdrop.me\\" to better display the 2 alternatives concerning about \\"custom\\" and modules / starters OR application templates.\\r\\n\\r\\nSee picture proposition.\\r\\n\\r\\nWDYT : [~iocanel] [~gytis] [~gandrian] [~claprun] [~lincolnthree]","customfield_12314040":null,"timetracking":{},"customfield_12310440":null,"customfield_12310120":null,"customfield_12310241":null,"customfield_12310640":"0.0","customfield_12310243":null,"attachment":[{"self":"https://issues.jboss.org/rest/api/2/attachment/12440716","id":"12440716","filename":"now.png","author":{"self":"https://issues.jboss.org/rest/api/2/user?username=cmoulliard","name":"cmoulliard","key":"cmoulliard","emailAddress":"cmoulliard@redhat.com","avatarUrls":{"48x48":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=48","24x24":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=24","16x16":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=16","32x32":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=32"},"displayName":"Charles Moulliard","active":true,"timeZone":"Europe/Berlin"},"created":"2018-09-21T01:26:06.000-0400","size":43648,"mimeType":"image/png","content":"https://issues.jboss.org/secure/attachment/12440716/now.png","thumbnail":"https://issues.jboss.org/secure/thumbnail/12440716/_thumb_12440716.png"},{"self":"https://issues.jboss.org/rest/api/2/attachment/12440715","id":"12440715","filename":"proposition.png","author":{"self":"https://issues.jboss.org/rest/api/2/user?username=cmoulliard","name":"cmoulliard","key":"cmoulliard","emailAddress":"cmoulliard@redhat.com","avatarUrls":{"48x48":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=48","24x24":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=24","16x16":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=16","32x32":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=32"},"displayName":"Charles Moulliard","active":true,"timeZone":"Europe/Berlin"},"created":"2018-09-21T01:26:06.000-0400","size":47333,"mimeType":"image/png","content":"https://issues.jboss.org/secure/attachment/12440715/proposition.png","thumbnail":"https://issues.jboss.org/secure/thumbnail/12440715/_thumb_12440715.png"},{"self":"https://issues.jboss.org/rest/api/2/attachment/12440714","id":"12440714","filename":"site-snowdrop.graffle","author":{"self":"https://issues.jboss.org/rest/api/2/user?username=cmoulliard","name":"cmoulliard","key":"cmoulliard","emailAddress":"cmoulliard@redhat.com","avatarUrls":{"48x48":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=48","24x24":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=24","16x16":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=16","32x32":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=32"},"displayName":"Charles Moulliard","active":true,"timeZone":"Europe/Berlin"},"created":"2018-09-21T01:26:15.000-0400","size":6077,"mimeType":"application/octet-stream","content":"https://issues.jboss.org/secure/attachment/12440714/site-snowdrop.graffle"}],"aggregatetimeestimate":null,"customfield_12310840":"9223372036854775807","customfield_12310641":"3.0","summary":"Proposition concerning start.snowdrop.me","creator":{"self":"https://issues.jboss.org/rest/api/2/user?username=cmoulliard","name":"cmoulliard","key":"cmoulliard","emailAddress":"cmoulliard@redhat.com","avatarUrls":{"48x48":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=48","24x24":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=24","16x16":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=16","32x32":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=32"},"displayName":"Charles Moulliard","active":true,"timeZone":"Europe/Berlin"},"subtasks":[],"reporter":{"self":"https://issues.jboss.org/rest/api/2/user?username=cmoulliard","name":"cmoulliard","key":"cmoulliard","emailAddress":"cmoulliard@redhat.com","avatarUrls":{"48x48":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=48","24x24":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=24","16x16":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=16","32x32":"https://static.jboss.org/developer/gravatar/6ccd7e1a636b2fa4838391b7551214ff?d=mm&s=32"},"displayName":"Charles Moulliard","active":true,"timeZone":"Europe/Berlin"},"customfield_12310092":null,"aggregateprogress":{"progress":0,"total":0},"customfield_10002":null,"customfield_12313841":null,"customfield_12310010":null,"environment":null,"customfield_12310211":null,"customfield_12313641":null,"customfield_12313640":null,"customfield_12313441":"","customfield_12313440":"0.0","duedate":null,"customfield_12313240":null,"customfield_12311140":null,"progress":{"progress":0,"total":0},"comment":{"comments":[],"maxResults":0,"total":0,"startAt":0},"votes":{"self":"https://issues.jboss.org/rest/api/2/issue/SB-889/votes","votes":0,"hasVoted":false},"worklog":{"startAt":0,"maxResults":20,"total":0,"worklogs":[]},"customfield_12311941":null,"customfield_12311940":"1|y008vw:"}}';
    issueJsonObj = JSON.parse(MY_JSON);
  }
//  console.log(JSON_OBJ);
  console.log(issueJsonObj.fields.status.name);
//  console.log(JSON_OBJ.result);
  let values = [
    [
      issueJsonObj.fields.status.name
    ],
  ];
  let resource = {
    values,
  };
  updateGsheetCell('I', rowNum, values);
  if (typeof bomRelease == 'undefined') {
    let values = [
      [
        issueJsonObj.fields.fixVersions
      ],
    ];
    let resource = {
      values,
    };
    updateGsheetCell('H', rowNum, values);
  }
}

/**
 *
*/
function updateGsheetCell(colNum, rowNum, resource) {
  sheets.spreadsheets.values.update({
    spreadsheetId: gsheet_id,
    range: SHEET_NAME+'!' + colNum + rowNum,
    valueInputOption: 'USER_ENTERED',
    resource,
  }, (err, result) => {
    if (err) {
      // Handle error
      console.log(err);
    } else {
      console.log('%d cell(s) updated at %s.', result.data.updatedCells, result.data.updatedRange);
    }
  })
}

/**
 * Usage information
*/
function printUsage() {
    console.log('usage: ');
    console.log('  gsheet.js gsheet_id [options]');
    console.log('Parameters:  ');
    console.log('    gsheet_id: ID of the Google Sheet to be used. Can be obtained from the URL https://docs.google.com/document/d/<document_id>');
    console.log('Options:  ');
    console.log('    --help: Prints this message');
}