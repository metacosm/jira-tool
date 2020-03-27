let util = require('./util.js')

module.exports = {
  GetIssueById,
  QueryIssues,
  PrintIssue: printIssue
}

// Get issue by id
async function GetIssueById (client, id) {
  try {
    var result = await client.issue.getIssue({
      issueKey: id
    })
    printIssue(id, util.convertJsontoObject(result))
  } catch (e) {
    util.Log.error(`Unable to get JIRA issue - Status code of error is:\nutil{e} ${e}`)
  }
}

async function QueryIssues (client, qs) {
client.search.search({
    jql: 'type = bug'
}, (error, issues)  => {
    if (err) throw err; // probably should be handling errors in case you get one from Jira
    const issue = issues.issues[0]; // this just gets the first issue in the resultset
    console.log(issue.fields.issueKey, issue.fields.issuetype.name, issue.fields.summary, issue.fields.status.name, issue.fields.resolution.name, issue.fields.labels, issue.fields.customfield_12600, issue.fields.customfield_14212, issue.fields.customfield_10009, issue.fields.customfield_14200, issue.fields.customfield_14205, issue.fields.customfield_14203, issue.fields.customfield_14204, issue.fields.customfield_10004);
    return issues;
});
//  try {
//    var result = await client.search.search(qs);
//    return result;
//  } catch (e) {
//    util.Log.error(`Unable to get JIRA issue - Status code of error is:\nutil{e} ${e}`)
//    throw e
//  }
}

function printIssue (id, issueType) {
  util.Log.info('Key         : ' + id.issueKey)
  util.Log.info('Title       : ' + issueType.summary)
  util.Log.info('Status      : ' + issueType.status.name)
  util.Log.info('Type        : ' + issueType.issuetype.name)
  util.Log.info('Author      : ' + issueType.reporter.name)
  if (issueType.description != null) {
    util.Log.info(
      'Description :\n' + issueType.description)
  }
  if (issueType.labels.length > 0) {
    util.Log.info('Labels: ', issueType.labels)
  }

  var regex = /\[(.*?)\]/
  var sprints = issueType.customfield_12310940
  if (sprints != null) {
    for (var i = 0, lengthSprints = sprints.length; i < lengthSprints; i++) {
      // util.Log.info("Sprint " + sprints[i]);
      var sprint = regex.exec(sprints[i])
      var pairs = sprint[1].split(',')
      var map = {}

      for (var j = 0, lengthPairs = pairs.length; j < lengthPairs; j++) {
        var str = pairs[j].split('=')
        map = util.addValueToList(map, str[0], str[1])
      }
      util.Log.info('Sprint Name : ' + map['name'] + ', state : ' + map['state'])
    }
  }
}
