export interface DataManagerEvents extends GlobalMixins.DataManagerEvents {
    setdata: [key: string, value: any];
    removedata: [key: string, value: any];
    changedata: [key: string, value: any, oldValue: any];
}