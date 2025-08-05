/*
 * Copyright 2023 SpinalCom - www.spinalcom.com
 * 
 * This file is part of SpinalCore.
 * 
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 * 
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 * 
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */

const config = {
  spinalConnector: {
    protocol: process.env.SPINALHUB_PROTOCOL, // user id
    user: process.env.SPINAL_USER_ID, // user id
    password: process.env.SPINAL_PASSWORD, // user password
    host: process.env.SPINALHUB_IP, // can be an ip address
    port: process.env.SPINALHUB_PORT, // port
  },
  monitoringApiConfig: {
    TokenBosRegister: process.env.TOKEN_BOS_REGISTER,
    monitoring_url: process.env.MONITORING_URL,
    monitoring_helath_url: process.env.MONITORING_HEALTH_URL,
    organName: process.env.ORGAN_NAME,
    email: process.env.EMAIL,
    password: process.env.PASSWORD,
    grant_type: process.env.GRANT_TYPE
  }
};
export default config;
export function getConfig() {
  return {
    monitoringPath: "/etc/Organs/Monitoring",
    updateInterval: 10000, // 10 secondes
    cpuAlertThreshold: 90, // %
  };
}