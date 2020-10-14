import { NowRequest, NowResponse } from '@now/node'

export default async function (req: NowRequest, res: NowResponse) {
    const { method, body } = req;

    if (method == 'POST' && body) {
        decode(body)
            .then((result) => { 
                res.status(result.status).json(result.json);
            });
    } else {
        res.status(403).json({ error: 'action not allowed' });
    }
};

export const decode = async (body: object) => {
    return {
        status: 200,
        json:  {
            "1": "decode"
        }
    };
}