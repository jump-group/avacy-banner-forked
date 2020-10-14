import { NowRequest, NowResponse } from '@now/node';
import { getDefaultTCModel } from '../src/scripts/core/core_cookies'


export default async function (req: NowRequest, res: NowResponse) {
    const { method, body } = req;

    if (method == 'POST' && body) {
        encode(body)
            .then((result) => { 
                res.status(result.status).json(result.json);
            });
    } else {
        res.status(403).json({ error: 'action not allowed' });
    }
};

export const encode = async (body: object) => {
    console.log(getDefaultTCModel());

    return {
        status: 200,
        json:  {
            "1": "encode"
        }
    };
}