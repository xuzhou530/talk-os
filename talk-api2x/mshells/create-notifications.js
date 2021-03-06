// Generated by CoffeeScript 1.10.0
(function() {
  var createNum, endTime, members, messages, msgMap, msgNum, processedNum, startTime, updateNum, userruntimes;

  startTime = ISODate();

  print("任务开始", startTime.toISOString());

  userruntimes = db.userruntimes.find({
    pinnedAts: {
      $ne: null
    }
  });

  createNum = 0;

  updateNum = 0;

  userruntimes.forEach(function(userruntime) {
    var _targetId, _teamId, conditions, existing, notification, pinnedAt, ref, results, room, teamPinnedAts, type, user;
    ref = userruntime.pinnedAts;
    results = [];
    for (_teamId in ref) {
      teamPinnedAts = ref[_teamId];
      results.push((function() {
        var results1;
        results1 = [];
        for (_targetId in teamPinnedAts) {
          pinnedAt = teamPinnedAts[_targetId];
          pinnedAt = new Date(pinnedAt);
          room = db.rooms.findOne({
            _id: ObjectId(_targetId)
          });
          if (room) {
            type = 'room';
          } else {
            user = db.users.findOne({
              _id: ObjectId(_targetId)
            });
            if (user) {
              type = 'dms';
            }
          }
          if (!(type && pinnedAt)) {
            continue;
          }
          conditions = {
            user: userruntime._id,
            team: ObjectId(_teamId),
            target: ObjectId(_targetId)
          };
          notification = db.notifications.findOne(conditions);
          if (notification != null ? notification.isPinned : void 0) {
            continue;
          }
          existing = true;
          if (!notification) {
            existing = false;
            notification = conditions;
            notification._id = ObjectId();
          }
          notification.type = type;
          if (notification.creator == null) {
            notification.creator = userruntime._id;
          }
          if (notification.text == null) {
            notification.text = '';
          }
          if (notification.isMute == null) {
            notification.isMute = false;
          }
          if (notification.unreadNum == null) {
            notification.unreadNum = 0;
          }
          notification.isPinned = true;
          if (notification.pinnedAt == null) {
            notification.pinnedAt = pinnedAt;
          }
          if (notification.createdAt == null) {
            notification.createdAt = new Date;
          }
          if (notification.updatedAt == null) {
            notification.updatedAt = new Date;
          }
          notification.isHidden = false;
          if (existing) {
            updateNum += 1;
          } else {
            createNum += 1;
          }
          results1.push(db.notifications.save(notification));
        }
        return results1;
      })());
    }
    return results;
  });

  print("置顶更新数", updateNum);

  print("置顶新建数", createNum);

  members = db.members.find({
    room: {
      $ne: null
    },
    'prefs.isMute': true
  });

  createNum = 0;

  updateNum = 0;

  members.forEach(function(member) {
    var conditions, existing, notification, room;
    room = db.rooms.findOne({
      _id: member.room
    });
    if (!(room != null ? room.team : void 0)) {
      return;
    }
    conditions = {
      target: room._id,
      team: room.team,
      user: member.user,
      type: 'room'
    };
    notification = db.notifications.findOne(conditions);
    if (notification != null ? notification.isMute : void 0) {
      return;
    }
    existing = true;
    if (!notification) {
      existing = false;
      notification = conditions;
      notification._id = ObjectId();
    }
    if (notification.creator == null) {
      notification.creator = member.user;
    }
    if (notification.text == null) {
      notification.text = '';
    }
    if (notification.unreadNum == null) {
      notification.unreadNum = 0;
    }
    if (notification.isPinned == null) {
      notification.isPinned = false;
    }
    notification.isMute = true;
    if (notification.createdAt == null) {
      notification.createdAt = new Date;
    }
    if (notification.updatedAt == null) {
      notification.updatedAt = new Date;
    }
    if (notification.isHidden == null) {
      notification.isHidden = true;
    }
    if (existing) {
      updateNum += 1;
    } else {
      createNum += 1;
    }
    return db.notifications.save(notification);
  });

  print("静音更新数", updateNum);

  print("静音新建数", createNum);

  msgNum = 0;

  msgMap = {};

  createNum = 0;

  processedNum = 0;

  messages = db.messages.find().sort({
    _id: -1
  }).limit(1000000);

  messages.forEach(function(message) {
    var idxKey, notifyText, ref, ref1, ref10, ref11, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, room, story;
    processedNum += 1;
    if ((processedNum % 10000) === 0) {
      print("执行记录数", processedNum);
    }
    if (message.isSystem) {
      return;
    }
    switch (false) {
      case !message.body:
        notifyText = message.body.slice(0, 51);
        break;
      case !((ref = message.attachments) != null ? (ref1 = ref[0]) != null ? (ref2 = ref1.data) != null ? ref2.fileName : void 0 : void 0 : void 0):
        notifyText = "{{__info-upload-files}} " + message.attachments[0].data.fileName;
        break;
      case !((ref3 = message.attachments) != null ? (ref4 = ref3[0]) != null ? (ref5 = ref4.data) != null ? ref5.title : void 0 : void 0 : void 0):
        notifyText = message.attachments[0].data.title.slice(0, 51);
        break;
      case !((ref6 = message.attachments) != null ? (ref7 = ref6[0]) != null ? (ref8 = ref7.data) != null ? ref8.text : void 0 : void 0 : void 0):
        notifyText = message.attachments[0].data.text.slice(0, 51);
        break;
      case ((ref9 = message.attachments) != null ? (ref10 = ref9[0]) != null ? ref10.category : void 0 : void 0) !== 'speech':
        notifyText = '{{__info-new-speech}}';
    }
    switch (false) {
      case !message.room:
        if (msgMap["" + message.room]) {
          return;
        }
        msgMap["" + message.room] = 1;
        room = db.rooms.findOne({
          _id: message.room
        }, {
          _id: 1,
          team: 1,
          isArchived: 1
        });
        if (!(room && !room.isArchived)) {
          return;
        }
        members = db.members.find({
          room: message.room,
          isQuit: false
        }, {
          user: 1
        });
        return members.forEach(function(member) {
          var conditions, notification;
          conditions = {
            user: member.user,
            team: message.team,
            target: room._id,
            type: 'room'
          };
          notification = db.notifications.findOne(conditions);
          if (notification) {
            return;
          }
          notification = conditions;
          notification._id = ObjectId();
          notification.creator = message.creator;
          notification.text = notifyText;
          notification.isMute = false;
          notification.unreadNum = 0;
          notification.isPinned = false;
          notification.createdAt = message.createdAt;
          notification.updatedAt = message.updatedAt;
          notification.isHidden = false;
          createNum += 1;
          return db.notifications.save(notification);
        });
      case !message.story:
        if (msgMap["" + message.story]) {
          return;
        }
        msgMap["" + message.story] = 1;
        story = db.stories.findOne({
          _id: message.story
        }, {
          _id: 1,
          team: 1,
          members: 1
        });
        if (!story) {
          return;
        }
        return (ref11 = story.members) != null ? ref11.forEach(function(_userId) {
          var conditions, notification;
          conditions = {
            user: _userId,
            team: message.team,
            target: message.story,
            type: 'story'
          };
          notification = db.notifications.findOne(conditions);
          if (notification) {
            return;
          }
          notification = conditions;
          notification._id = ObjectId();
          notification.creator = message.creator;
          notification.text = notifyText;
          notification.isMute = false;
          notification.unreadNum = 0;
          notification.isPinned = false;
          notification.createdAt = message.createdAt;
          notification.updatedAt = message.updatedAt;
          notification.isHidden = false;
          createNum += 1;
          return db.notifications.save(notification);
        }) : void 0;
      case !message.to:
        idxKey = ["" + message.creator, "" + message.to].sort(function(a, b) {
          if (a > b) {
            return 1;
          } else {
            return -1;
          }
        }).join('');
        if (msgMap[idxKey]) {
          return;
        }
        msgMap[idxKey] = 1;
        return [message.creator, message.to].forEach(function(_userId, i) {
          var conditions, notification;
          conditions = {
            user: _userId,
            team: message.team,
            target: i === 0 ? message.to : message.creator,
            type: 'dms'
          };
          notification = db.notifications.findOne(conditions);
          if (notification) {
            return;
          }
          notification = conditions;
          notification._id = ObjectId();
          notification.creator = message.creator;
          notification.text = notifyText;
          notification.isMute = false;
          notification.unreadNum = 0;
          notification.isPinned = false;
          notification.createdAt = message.createdAt;
          notification.updatedAt = message.updatedAt;
          notification.isHidden = false;
          createNum += 1;
          return db.notifications.save(notification);
        });
    }
  });

  print("创建通知数", createNum);

  endTime = ISODate();

  print("任务结束", endTime.toISOString());

  print("总用时", Math.floor((endTime - startTime) / 1000), '秒');

}).call(this);
