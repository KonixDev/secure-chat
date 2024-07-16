export const room = [
    {
        messages: [
            {
                id: 1,
                nickname: 'Jane Doe',
                text: 'Hey, Jakob',
                timestamp:  '2021-09-01T12:00:00',
                expiresAt: '2021-09-01T12:05:00',
            },
            {
                id: 2,
                nickname: 'Jakob Hoeg',
                text: 'Hey!',
                timestamp: '2021-09-01T12:01:00',
                expiresAt: '2021-09-01T12:06:00',
            }
        ],
        roomId: '12345',
    },
];

export type RoomData = (typeof room)[number];

export const loggedInUserData = {
    nickname: 'Jakob Hoeg',
};

export type LoggedInUserData = (typeof loggedInUserData);

export interface Message {
    id: number;
    timestamp: string;
    nickname: string;
    text: string;
    expiresAt: string;
}

export interface User {
    id: number;
    messages: Message[];
    nickname: string;
}