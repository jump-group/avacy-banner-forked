import { NowRequest, NowResponse } from '@now/node';
import {TCString} from '@iabtcf/core';
import { getAllPreferences } from './../src/scripts/core/core_consents';

export default async function (req: NowRequest, res: NowResponse) {
    const { method, body } = req;

    if (method == 'POST' && body) {
        decode(body)
            .then((result) => { 
                res.status(result.status).json(result.json);
            });
    } else {
        res.status(403).json({ error: 'dsadada not allowed' });
    }
};

export const decode = async (body) => {
    let tcString = JSON.parse(body).IABTCF_TCString;
    const tcModel = TCString.decode(tcString);
    let privacySettings = getAllPreferences(tcModel);

    return {
        status: 200,
        json: privacySettings
    };
}