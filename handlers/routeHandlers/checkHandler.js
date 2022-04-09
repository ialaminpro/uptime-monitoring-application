/**------------------------------------------------------------------------
 * @Title          :  Check Handler
 * @author         :  Al Amin
 * @email          :  ialamin.pro@gmail.com
 * @repo           :  https://github.com/ialaminpro/uptime-monitoring-application
 * @createdOn      :  07/04/2022
 * @description    :  Handler to handle user define check
 *------------------------------------------------------------------------* */

// dependencies
const data = require('../../lib/fileHandle');
const { parseJSON, createRandomString } = require('../../helpers/utilities');
const tokenHander = require('./tokenHandler');
const { maxChecks } = require('../../helpers/environments');

// module scaffolding
const handler = {};

handler.checkHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._check[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};

handler._check = {};

handler._check.post = (requestProperties, callback) => {
    // validate inputs
    let protocol = typeof requestProperties.body.protocol === 'string' &&  ['http', 'https'].indexOf(requestProperties.body.protocol) > -1 ? requestProperties.body.protocol : false;
    let url = typeof requestProperties.body.url === 'string' && requestProperties.body.url.trim().length > 0 ? requestProperties.body.url : false;
    let method = typeof requestProperties.body.method === 'string' &&  ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1 ? requestProperties.body.method : false;
    let successCodes = typeof requestProperties.body.successCodes === 'object' &&  requestProperties.body.successCodes instanceof Array? requestProperties.body.successCodes : false;
    let timeoutSeconds = typeof requestProperties.body.timeoutSeconds === 'number' && requestProperties.body.timeoutSeconds % 1 === 0 &&  requestProperties.body.timeoutSeconds >= 1 && requestProperties.body.timeoutSeconds <= 5 ? requestProperties.body.timeoutSeconds : false;
    if(protocol && url && method && successCodes && timeoutSeconds) {
        // verify token
        let token = typeof requestProperties.headersObject.token === 'string' ? requestProperties.headersObject.token : false;
        
        // lookup the user phone by reading the token
        data.read('tokens', token, (err, tokenData) => {
            if(!err && tokenData){
                let userPhone  = parseJSON(tokenData).phone;
                // lookup the user data
                data.read('users', userPhone, (error, userData) => {
                    if(!error && userData){
                        tokenHander._token.verify(token, userPhone, (tokenIsValid) => {
                            if(tokenIsValid){
                                let userObject = parseJSON(userData);
                                let userChecks = typeof userObject.checks === 'object' && userObject.checks instanceof Array ? userObject.checks : [];

                                if(userChecks.length < maxChecks){
                                    let checkId = createRandomString(20);
                                    let checkObject = {
                                        'id': checkId,
                                        userPhone,
                                        protocol,
                                        url,
                                        method,
                                        successCodes,
                                        timeoutSeconds
                                    }
                                    // save the object
                                    data.create('checks', checkId, checkObject, (error) => {
                                        if(!error){
                                            // add check id to the user's object
                                            userObject.checks = userChecks;
                                            userObject.checks.push(checkId);

                                            //save the new user data
                                            data.update('users', userPhone, userObject, (err2) => {
                                                if(!err2){
                                                    // return the data about the new check
                                                    callback(200, checkObject);
                                                }else{
                                                    callback(500, {
                                                        error: 'There was a problem in the server side!',
                                                    });
                                                }
                                            })
                                        }else{
                                            callback(500, {
                                                error: 'There was a problem in the server side!',
                                            });
                                        }
                                    })
                                }else{
                                    callback(401, {
                                        error: 'User has already reached max check limit!',
                                    });
                                }
                            }else{
                                callback(403, {
                                    error: 'Authentication problem!',
                                });
                            }
                        });
                    }else{
                        callback(403, {
                            error: 'User not found!',
                        })
                    }
                });
            }else{
                callback(403, {
                    error: "Authentication failure!",
                })
            }
        }) 

    }else{
        callback(400, {
            error: 'You have a problem in your request',
        })
    }
};

handler._check.get = (requestProperties, callback) => {
};

handler._check.put = (requestProperties, callback) => {
};

handler._check.delete = (requestProperties, callback) => {};

module.exports = handler;