/**------------------------------------------------------------------------
 * @Title          :  Routes
 * @author         :  Al Amin
 * @email          :  ialamin.pro@gmail.com
 * @repo           :  https://github.com/ialaminpro/uptime-monitoring-application
 * @createdOn      :  05/04/2022
 * @description    :  Application Route
 *------------------------------------------------------------------------* */

// dependencies
const { sampleHandler } = require('./handlers/routeHandlers/sampleHandler');

const routes = {
    sample: sampleHandler,
};

module.exports = routes;