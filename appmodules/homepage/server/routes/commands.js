var express = require('express');
var jwt = require('jsonwebtoken');
var secret = require('../common/config').secret;
var contactusconModel = require('../models/contactus').contactusModel;
var myhelper = require('../modules/myhelpers');
var jwtauth = require('../common/jwtauth');
var fs = fs = require('fs');
var randomstring = require("randomstring");
var captchaModel = require("../models/captcha").captchaModel;
var membersModel = require('../models/members').membersModel;
var registrationModule = require('../models/registration');
var regSchema = registrationModule.regSchema;
var regModel = registrationModule.regModel;
var cityLoaderobject = require('../../../../classhelpers').siteHelper;
var cityLoader = new cityLoaderobject();

var mails = [
  'mail from eli',
  'mail from nataly',
  'mail from dddd'
];


var routes = function (app) {


  var commandsRouter = express.Router();


  app.get('/api/getcities', jwtauth, function (req, res, next) {

    console.log('getcities');
    cityLoader.basic("C:/GojiLTDTrunk/reallove/citieswithcode.csv", function (rows)
    {
       //console.log(rows);
       res.send(rows);
    });
  });

  app.get('/api/getcaptch', jwtauth, function (req, res, next) {
    var value = randomstring.generate(5);

    var c = new captchaModel();
    c.registrationObjectId = req.idFromToken;


    captchaModel.findOne({'registrationObjectId': req.idFromToken}, function (err, data) {
      if (err) {
        console.log(err);
        return res.status(401).json({
          error: err
        });
      }
      if (!data) {
        c.value = value;
        c.save(function (err) {
          if (err) {
            console.log(err);
            return res.status(500).json({
              error: 'Cannot save the new member'
            });
          } else {
            res.json({
              value: value
            });
          }
        });
      } else {
        console.log("need to update the captch ");
        captchaModel.findOneAndUpdate({'registrationObjectId': req.idFromToken} , {'value':value}, function (err, data) {
          if (err) {
            console.log(err);
            return res.status(500).json({
              error: 'Cannot save the new member'
            });
          }
        });

        res.json({
          value: value
        });
      }
    });
  });


  app.post('/api/deletepospondcard', jwtauth, function (req, res, next) {


    console.log(req.body.capdata.usercode);

    console.log(req.idFromToken);

    contactusconModel.remove({'registrationObjectId': req.idFromToken}, function (err) {
      if (err) {
        console.log(err);
        return res.status(401).json({
          error: err
        });
      }

      membersModel.remove({'registrationObjectId': req.idFromToken}, function (err) {
        if (err) {
          console.log(err);
          return res.status(401).json({
            error: err
          });
        }

        captchaModel.remove({'registrationObjectId': req.idFromToken}, function (err) {
          if (err) {
            console.log(err);
            return res.status(401).json({
              error: err
            });
          }

          regModel.remove({'_id': req.idFromToken}, function (err) {
            if (err) {
              console.log(err);
              return res.status(401).json({
                error: err
              });
            }
            res.sendStatus(201);
          });
        });
      });
    });
  });


  app.post('/api/deletepicture', jwtauth, function (req, res, next) {
    console.log("here2 " + req.body.token);
    try {
      var decoded = jwt.verify(req.body.token, secret);
      console.log("here3");
      // delete a file from the directory
      var fileName = './uploads/' + decoded.sub + '/raw/' + req.body.filenum + '.jpg';
      fs.unlinkSync(fileName);
      fileName = './uploads/' + decoded.sub + '/base64/' + req.body.filenum + '.jpg';
      console.log(fileName);
      fs.unlinkSync(fileName);
      res.sendStatus(200);
    }
    catch (err) {
      res.sendStatus(500);
    }
  });


  app.get('/api/commands/contactus/yougotmail', jwtauth, function (req, res) {

    res.json(mails);
  });


  app.post('/api/commands/contactus', jwtauth, function (req, res) {

    var c = new contactusconModel(req.body);
    c.registrationObjectId = req.idFromToken;
    console.log(c.registrationObjectId);

    var todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    var query = contactusconModel.find({'created': {$gte: todayDate}});
    query.exec(function (err, docs) {
      console.log(docs.length);
      if (docs.length < 5) {
        c.save(function (err) {
          if (err) {
            console.log(err);
            return res.status(500).json({
              error: 'Cannot save the new member'
            });
          }
          res.status(204).send("ok");
        });
      } else {
        res.status(500).send("you have sent too much message today\nmax allow are 5 messages per day");
      }
    });
  });

  return {
    routes: routes
  }
}

module.exports = routes;