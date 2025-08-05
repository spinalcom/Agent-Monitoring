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
import { TokenManager } from "./TokenManager";
const querystring = require('querystring');


export class ApiConnector {
  private TokenManager: TokenManager;
  constructor() {
    this.TokenManager = new TokenManager();
  }

  public async getConfig() {
    return {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "x-access-token": await this.TokenManager.getToken()
      }
    }
  }

  /**
   * @param {string} url
   * @return {*}
   * @memberof ApiConnector
   */
  public async get<T>(url: string) {
    const config = await this.getConfig();
    return axios.get<T>(url, config);
  }

  /**
   *
   * @param {string} url
   * @param {*} data
   * @return {*}
   * @memberof ApiConnector
   */
  public async post(url: string, data: any) {
    const config = await this.getConfig();
    return axios.post(url, data, config);
  }

  public async postAuth(url: string, data: any) {
    return axios.post(url, data);
  }

}
