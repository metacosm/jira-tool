let $ = require('./util.js')
let jsontoyaml = require('json2yaml')
let yaml = require('js-yaml')
var jiraClient, ymlText, yamlIssue, regex, sprints

module.exports = {
  JiraClient,
  GetIssueById
}

function JiraClient(host, username, password) {
  jiraClient = $.myJiraClient(host, username, password)
}

// Get issue by id
async function GetIssueById(id) {
  try {
    var result = await getJiraIssue(id)
    // getJiraIssue(id)

    ymlText = jsontoyaml.stringify(result.fields)
    console.log(yaml.safeLoad(ymlText))
    issueType = yaml.safeLoad(ymlText)

    console.log('Key         : ' + id.issueKey)
    console.log('Title       : ' + issueType.summary)
    console.log('Status      : ' + issueType.status.name)
    console.log('Type        : ' + issueType.issuetype.name)
    console.log('Author      : ' + issueType.reporter.name)
    if (issueType.description != null) {
      console.log(
        'Description :\n' + issueType.description)
    }
    if (issueType.labels.length > 0) {
      console.log('Labels: ', issueType.labels)
    }


    regex = /\[(.*?)\]/
    sprints = issueType.customfield_12310940
    if (sprints != null) {
      for (var i = 0, lengthSprints = sprints.length; i < lengthSprints; i++) {
        // console.log("Sprint " + sprints[i]);
        var sprint = regex.exec(sprints[i])
        var pairs = sprint[1].split(',')
        var map = {}

        for (var j = 0, lengthPairs = pairs.length; j < lengthPairs; j++) {
          var str = pairs[j].split('=')
          map = $.addValueToList(map, str[0], str[1])
        }
        console.log('Sprint Name : ' + map['name'] + ', state : ' + map['state'])
      }
    }
  } catch (e) {
    console.log(`Unable to get JIRA issue - Status code of error is:\n${e}`)
  }
}

function getJiraIssue(id) {
  return jiraClient.issue.getIssue(id)
}
