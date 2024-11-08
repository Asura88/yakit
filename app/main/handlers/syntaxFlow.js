const {ipcMain} = require("electron");

module.exports = (win, getClient) => {
    const asyncQuerySyntaxFlowRuleGroup = (params) => {
        return new Promise((resolve, reject) => {
            getClient().QuerySyntaxFlowRuleGroup(params, (err, data) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(data)
            })
        })
    }
    // 获取规则组数据
    ipcMain.handle("QuerySyntaxFlowRuleGroup", async (e, params) => {
        return await asyncQuerySyntaxFlowRuleGroup(params)
    })

    const asyncQuerySyntaxFlowRule = (params) => {
        return new Promise((resolve, reject) => {
            getClient().QuerySyntaxFlowRule(params, (err, data) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(data)
            })
        })
    }
    // 获取规则组所含规则
    ipcMain.handle("QuerySyntaxFlowRule", async (e, params) => {
        return await asyncQuerySyntaxFlowRule(params)
    })

    // 规则执行
    const handlerHelper = require("./handleStreamWithContext");
    const streamSyntaxFlowScanMap = new Map();
    ipcMain.handle("cancel-SyntaxFlowScan", handlerHelper.cancelHandler(streamSyntaxFlowScanMap));
    ipcMain.handle("SyntaxFlowScan", (e, params, token) => {
        let stream = streamSyntaxFlowScanMap.get(token)
        if (stream) {
            stream.write(params)
            return
        }
        stream = getClient().SyntaxFlowScan();
        stream.write(params)
        handlerHelper.registerHandler(win, stream, streamSyntaxFlowScanMap, token)
    })

    const asyncQuerySyntaxFlowResult = (params) => {
        return new Promise((resolve, reject) => {
            getClient().QuerySyntaxFlowResult(params, (err, data) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(data)
            })
        })
    }
    // 获取审计结果
    ipcMain.handle("QuerySyntaxFlowResult", async (e, params) => {
        return await asyncQuerySyntaxFlowResult(params)
    })
}