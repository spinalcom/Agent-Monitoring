/*
 * Copyright 2022 SpinalCom - www.spinalcom.com
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

import axios, { AxiosRequestConfig } from "axios";
import config from "./config";
const querystring = require('querystring');


export class TokenManager {
  private monitoring_url_auth: string;
  private token: string;
  private expire_in: number;
  private obtained_time: number;


  constructor() {
    this.token = ""
    this.monitoring_url_auth = config.monitoringApiConfig.monitoring_url + '/users/login';
  }

  public isExpired() {
    const now = new Date().getTime();
    return now - this.obtained_time > this.expire_in;
  }

  // Return token if exist or isn't expired, else create a new one
  public async getToken(): Promise<string> {
    try {
      if (this.token && !this.isExpired()) {
        return this.token;
      }
      const response = await axios.post(this.monitoring_url_auth,
        querystring.stringify({ email: config.monitoringApiConfig.email, password: config.monitoringApiConfig.password }));
      this.token = response.data.token;
      this.expire_in = response.data.expieredToken * 1000; // convert to ms
      this.obtained_time = new Date().getTime();
      return this.token;
    } catch (error) {
      console.error(error);
      throw (error)
    }
  }
}
