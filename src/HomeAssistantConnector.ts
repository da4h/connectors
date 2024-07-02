import {
    Connection,
    createConnection,
    subscribeEntities,
    createLongLivedTokenAuth,
    HassServiceTarget
} from "home-assistant-js-websocket";
import { Publisher, ConnectionState, Connector } from "@da4h/core/dist";

const wnd = globalThis;
wnd.WebSocket = require("ws");

export class HomeAssistantConnector extends Connector {
    private _connection: Connection;

    public constructor() {
        super();
    }

    public async connect(options: {url: string, longLivedToken: string}) {
        const auth = createLongLivedTokenAuth(
            options.url,
            options.longLivedToken
        );
        
        this._connection = await createConnection({ auth });
        this.state.publish(ConnectionState.Available);

        subscribeEntities(this._connection, entities => {
            Object.keys(entities).forEach(id => {
                if (!this.subscriptions.hasOwnProperty(id)) return;

                this.subscriptions[id].publish(entities[id]);
            });
        });
    }

    publish(key: string, publisher: Publisher<any>) {
        throw new Error("Method not implemented.");
    }

    public callService(
        domain: string,
        service: string,
        data?: { [key: string]: any },
        target?: HassServiceTarget
    ) {
        const serviceCall = {
            type: 'call_service',
            domain,
            service,
            service_data: { ...data, ...target },
        };
    
        return this._connection.sendMessagePromise(serviceCall);
    }
}