import React, {useEffect, useRef, useState} from "react"
import {PortScanExecuteExtraFormValue} from "./NewPortScanType"
import {Form, FormInstance} from "antd"
import {useCreation, useMemoizedFn} from "ahooks"
import {YakitDrawer} from "@/components/yakitUI/YakitDrawer/YakitDrawer"
import styles from "./NewPortScanExtraParamsDrawer.module.scss"
import {YakitSelect} from "@/components/yakitUI/YakitSelect/YakitSelect"
import {ScanKind, ScanKindKeys} from "@/pages/portscan/PortScanPage"
import {YakitRadioButtons} from "@/components/yakitUI/YakitRadioButtons/YakitRadioButtons"
import YakitCollapse from "@/components/yakitUI/YakitCollapse/YakitCollapse"
import {YakitButton} from "@/components/yakitUI/YakitButton/YakitButton"
import {SelectOptionProps} from "@/pages/fuzzer/HTTPFuzzerPage"
import {GlobalNetworkConfig, defaultParams} from "@/components/configNetwork/ConfigNetworkPage"
import {PcapMetadata} from "@/models/Traffic"
import {YakitInputNumber} from "@/components/yakitUI/YakitInputNumber/YakitInputNumber"
import {YakitSwitch} from "@/components/yakitUI/YakitSwitch/YakitSwitch"
import {YakitInput} from "@/components/yakitUI/YakitInput/YakitInput"
import {YakitCheckbox} from "@/components/yakitUI/YakitCheckbox/YakitCheckbox"
import {defPortScanExecuteExtraFormValue} from "./NewPortScan"
import {yakitInfo} from "@/utils/notification"
import {apiGetGlobalNetworkConfig, apiGetPcapMetadata, apiSetGlobalNetworkConfig} from "@/pages/spaceEngine/utils"
import cloneDeep from "lodash/cloneDeep"

const {ipcRenderer} = window.require("electron")
const {YakitPanel} = YakitCollapse

interface NewPortScanExtraParamsDrawerProps {
    extraParamsValue: PortScanExecuteExtraFormValue
    visible: boolean
    onSave: (v: PortScanExecuteExtraFormValue) => void
}
/**其他配置 */
const defaultOtherSetting = {
    SaveToDB: defPortScanExecuteExtraFormValue.SaveToDB,
    SaveClosedPorts: defPortScanExecuteExtraFormValue.SaveClosedPorts,
    EnableCClassScan: defPortScanExecuteExtraFormValue.EnableCClassScan,
    SkippedHostAliveScan: defPortScanExecuteExtraFormValue.SkippedHostAliveScan,
    HostAliveConcurrent: defPortScanExecuteExtraFormValue.HostAliveConcurrent,
    ExcludeHosts: defPortScanExecuteExtraFormValue.ExcludeHosts,
    ExcludePorts: defPortScanExecuteExtraFormValue.ExcludePorts
}
/**爬虫设置 */
const defaultReptileSetting = {
    EnableBasicCrawler: defPortScanExecuteExtraFormValue.EnableBasicCrawler,
    BasicCrawlerRequestMax: defPortScanExecuteExtraFormValue.BasicCrawlerRequestMax,
    BasicCrawlerEnableJSParser: defPortScanExecuteExtraFormValue.BasicCrawlerEnableJSParser
}
/**指纹扫描配置 */
const defaultFingerprintSetting = {
    Concurrent: defPortScanExecuteExtraFormValue.Concurrent,
    Active: defPortScanExecuteExtraFormValue.Active,
    ProbeMax: defPortScanExecuteExtraFormValue.ProbeMax,
    ProbeTimeout: defPortScanExecuteExtraFormValue.ProbeTimeout,
    Proxy: defPortScanExecuteExtraFormValue.Proxy,
    FingerprintMode: defPortScanExecuteExtraFormValue.FingerprintMode
}
/** SYN 配置 */
const defaultSYNSetting = {
    SynConcurrent: defPortScanExecuteExtraFormValue.SynConcurrent
}
/** 网卡配置 */
const defaultNetworkCard = {
    SynScanNetInterface: defPortScanExecuteExtraFormValue.SynScanNetInterface
}
const defaultExtraParamsFormValue = {
    网卡配置: defaultNetworkCard,
    "SYN 配置": defaultSYNSetting,
    指纹扫描配置: defaultFingerprintSetting,
    基础爬虫配置: defaultReptileSetting,
    其他配置: defaultOtherSetting
}
const NewPortScanExtraParamsDrawer: React.FC<NewPortScanExtraParamsDrawerProps> = React.memo((props) => {
    const {extraParamsValue, visible, onSave} = props
    const [form] = Form.useForm()
    useEffect(() => {
        if (visible) {
            form.setFieldsValue({...extraParamsValue})
        }
    }, [visible, extraParamsValue])
    const onClose = useMemoizedFn(() => {
        onSaveSetting()
    })
    const onSaveSetting = useMemoizedFn(() => {
        form.validateFields().then((formValue) => {
            onSave(formValue)
        })
    })
    return (
        <YakitDrawer
            className={styles["port-scan-execute-extra-params-drawer"]}
            visible={visible}
            onClose={onClose}
            width='65%'
            title='额外参数'
        >
            <Form size='small' labelCol={{span: 6}} wrapperCol={{span: 18}} form={form}>
                <NewPortScanExtraParams form={form} visible={visible} />
                <div className={styles["to-end"]}>已经到底啦～</div>
            </Form>
        </YakitDrawer>
    )
})
export default NewPortScanExtraParamsDrawer

interface NewPortScanExtraParamsProps {
    form: FormInstance<PortScanExecuteExtraFormValue>
    visible: boolean
}
const NewPortScanExtraParams: React.FC<NewPortScanExtraParamsProps> = React.memo((props) => {
    const {form, visible} = props

    const [activeKey, setActiveKey] = useState<string[]>([
        "网卡配置",
        "SYN 配置",
        "指纹扫描配置",
        "基础爬虫配置",
        "其他配置"
    ])
    const [netInterfaceList, setNetInterfaceList] = useState<SelectOptionProps[]>([]) // 代理代表

    const globalNetworkConfig = useRef<GlobalNetworkConfig | undefined>(cloneDeep(defaultParams))

    const mode = Form.useWatch("Mode", form)
    const skippedHostAliveScan = Form.useWatch("SkippedHostAliveScan", form)
    const saveToDB = Form.useWatch("SaveToDB", form)
    const enableBasicCrawler = Form.useWatch("EnableBasicCrawler", form)

    useEffect(() => {
        if (!visible) return
        apiGetGlobalNetworkConfig()
            .then((rsp: GlobalNetworkConfig) => {
                globalNetworkConfig.current = rsp
                apiGetPcapMetadata().then((data: PcapMetadata) => {
                    if (!data || data.AvailablePcapDevices.length === 0) {
                        return
                    }
                    const interfaceList = data.AvailablePcapDevices.map((item) => ({
                        label: `${item.NetInterfaceName}-(${item.IP})`,
                        value: item.Name
                    }))
                    setNetInterfaceList(interfaceList)
                })
            })
            .catch(() => {
                globalNetworkConfig.current = undefined
            })
    }, [visible])

    const protoList = useCreation(() => {
        return [
            {label: "TCP", value: "tcp"},
            {label: "UDP", value: "udp", disabled: mode === "syn" || mode === "all"}
        ]
    }, [mode])
    const onReset = useMemoizedFn((key) => {
        const value = defaultExtraParamsFormValue[key]
        form.setFieldsValue({
            ...value
        })
    })
    const updateGlobalNetworkConfig = useMemoizedFn((e) => {
        e.stopPropagation()
        if (!globalNetworkConfig.current) return
        const synScanNetInterface = form.getFieldValue("SynScanNetInterface")
        const params: GlobalNetworkConfig = {
            ...globalNetworkConfig.current,
            SynScanNetInterface: synScanNetInterface
        }
        apiSetGlobalNetworkConfig(params).then(() => {
            yakitInfo("更新配置成功")
        })
    })
    /**mode syn 对应的配置 */
    const synCollapseNode = useMemoizedFn(() => {
        return (
            <>
                <YakitPanel
                    header='网卡配置'
                    key='网卡配置'
                    extra={
                        <YakitButton
                            type='text'
                            colors='danger'
                            size='small'
                            onClick={(e) => {
                                e.stopPropagation()
                                onReset("网卡配置")
                            }}
                        >
                            重置
                        </YakitButton>
                    }
                    className={styles["form-Panel"]}
                >
                    <Form.Item
                        label='网卡选择'
                        extra={
                            <YakitButton type='text' style={{paddingLeft: 0}} onClick={updateGlobalNetworkConfig}>
                                同步到全局配置
                            </YakitButton>
                        }
                        name='SynScanNetInterface'
                        style={{marginBottom: 0}}
                    >
                        <YakitSelect allowClear placeholder='请选择...' options={netInterfaceList} />
                    </Form.Item>
                </YakitPanel>
                <YakitPanel
                    header='SYN 配置'
                    key='SYN 配置'
                    extra={
                        <YakitButton
                            type='text'
                            colors='danger'
                            size='small'
                            onClick={(e) => {
                                e.stopPropagation()
                                onReset("SYN 配置")
                            }}
                        >
                            重置
                        </YakitButton>
                    }
                >
                    <Form.Item
                        label='SYN 并发'
                        name='SynConcurrent'
                        extra={"每秒发送 SYN 数据包数量，可视为 SYN 并发量"}
                        style={{marginBottom: 0}}
                    >
                        <YakitInputNumber type='horizontal' min={0} />
                    </Form.Item>
                </YakitPanel>
            </>
        )
    })
    /**mode fingerprint 对应的配置 */
    const fingerprintCollapseNode = useMemoizedFn(() => {
        return (
            <>
                <YakitPanel
                    header='指纹扫描配置'
                    key='指纹扫描配置'
                    extra={
                        <YakitButton
                            type='text'
                            colors='danger'
                            size='small'
                            onClick={(e) => {
                                e.stopPropagation()
                                onReset("指纹扫描配置")
                            }}
                        >
                            重置
                        </YakitButton>
                    }
                >
                    <Form.Item label='指纹扫描并发' name='Concurrent'>
                        <YakitInputNumber type='horizontal' min={0} />
                    </Form.Item>
                    <Form.Item label='主动模式' name='Active' valuePropName='checked' extra='允许指纹探测主动发包'>
                        <YakitSwitch />
                    </Form.Item>
                    <Form.Item
                        label='服务指纹级别'
                        name='ProbeMax'
                        extra='级别越高探测的详细程度越多，主动发包越多，时间越长'
                    >
                        <YakitRadioButtons
                            buttonStyle='solid'
                            options={[
                                {value: 1, label: "基础"},
                                {value: 3, label: "适中"},
                                {value: 7, label: "详细"},
                                {value: 100, label: "全部"}
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        label='主动发包超时时间'
                        name='ProbeTimeout'
                        extra='某些指纹的检测需要检查目标针对某一个探针请求的响应，需要主动发包'
                    >
                        <YakitInputNumber type='horizontal' min={0} />
                    </Form.Item>
                    <Form.Item
                        label='TCP 代理'
                        name='Proxy'
                        extra='支持 HTTP/Sock4/Sock4a/Socks5 协议，例如 http://127.0.0.1:7890  socks5://127.0.0.1:7890'
                    >
                        <YakitSelect
                            allowClear
                            placeholder='请选择...'
                            options={[
                                "http://127.0.0.1:7890",
                                "http://127.0.0.1:8082",
                                "socks5://127.0.0.1:8082",
                                "http://127.0.0.1:8083"
                            ].map((i) => {
                                return {value: i, label: i}
                            })}
                            mode='tags'
                        />
                    </Form.Item>
                    <Form.Item label='高级指纹选项' name='FingerprintMode'>
                        <YakitRadioButtons
                            buttonStyle='solid'
                            options={[
                                {value: "web", label: "仅web指纹"},
                                {value: "service", label: "服务指纹"},
                                {value: "all", label: "全部指纹"}
                            ]}
                        />
                    </Form.Item>
                </YakitPanel>
                <YakitPanel
                    header='基础爬虫配置'
                    key='基础爬虫配置'
                    extra={
                        <YakitButton
                            type='text'
                            colors='danger'
                            size='small'
                            onClick={(e) => {
                                e.stopPropagation()
                                onReset("基础爬虫配置")
                            }}
                        >
                            重置
                        </YakitButton>
                    }
                >
                    <Form.Item
                        label='爬虫设置'
                        extra={"在发现网站内容是一个 HTTP(s) 服务后，进行最基础的爬虫以发现更多数据"}
                    >
                        <div className={styles["form-no-style-wrapper"]}>
                            <Form.Item noStyle name='EnableBasicCrawler' valuePropName='checked'>
                                <YakitCheckbox />
                            </Form.Item>
                            <Form.Item noStyle name='BasicCrawlerRequestMax'>
                                <YakitInputNumber min={0} addonBefore='爬虫请求数' />
                            </Form.Item>
                        </div>
                    </Form.Item>
                    {enableBasicCrawler && (
                        <Form.Item
                            label='JS SSA解析'
                            name='BasicCrawlerEnableJSParser'
                            valuePropName='checked'
                            extra={"在启用爬虫时进行JS SSA解析。开启后会使用大量资源,造成cpu飙升,如无需要建议关闭"}
                        >
                            <YakitSwitch />
                        </Form.Item>
                    )}
                </YakitPanel>
            </>
        )
    })
    /**other setting */
    const otherSettingCollapseNode = useMemoizedFn(() => {
        return (
            <>
                <YakitPanel
                    header='其他配置'
                    key='其他配置'
                    extra={
                        <YakitButton
                            type='text'
                            colors='danger'
                            size='small'
                            onClick={(e) => {
                                e.stopPropagation()
                                onReset("其他配置")
                            }}
                        >
                            重置
                        </YakitButton>
                    }
                >
                    <Form.Item label='扫描结果入库' name='SaveToDB' valuePropName='checked'>
                        <YakitSwitch />
                    </Form.Item>
                    {saveToDB && (
                        <>
                            <Form.Item label='保存关闭的端口' name='SaveClosedPorts' valuePropName='checked'>
                                <YakitSwitch />
                            </Form.Item>
                        </>
                    )}

                    <Form.Item
                        label='自动扫相关C段'
                        name='EnableCClassScan'
                        valuePropName='checked'
                        extra='可以把域名 /IP 转化为 C 段目标，直接进行扫描'
                    >
                        <YakitSwitch />
                    </Form.Item>
                    <Form.Item
                        label='跳过主机存活检测'
                        name='SkippedHostAliveScan'
                        valuePropName='checked'
                        extra='主机存活检测，根据当前用户权限使用 ICMP/TCP Ping 探测主机是否存活'
                    >
                        <YakitSwitch />
                    </Form.Item>
                    {!skippedHostAliveScan && (
                        <>
                            <Form.Item label='存活检测并发' name='HostAliveConcurrent'>
                                <YakitInputNumber type='horizontal' min={0} />
                            </Form.Item>
                            <Form.Item
                                label='TCP Ping 端口'
                                name='HostAlivePorts'
                                extra='配置 TCP Ping 端口：以这些端口是否开放作为 TCP Ping 依据'
                            >
                                <YakitInput placeholder='请输入...' />
                            </Form.Item>
                        </>
                    )}

                    <Form.Item label='排除主机' name='ExcludeHosts'>
                        <YakitInput placeholder='请输入...' />
                    </Form.Item>
                    <Form.Item label='排除端口' name='ExcludePorts'>
                        <YakitInput placeholder='请输入...' />
                    </Form.Item>
                </YakitPanel>
            </>
        )
    })
    const renderContent = useMemoizedFn(() => {
        switch (mode) {
            // SYN
            case "syn":
                return (
                    <>
                        {synCollapseNode()}
                        {otherSettingCollapseNode()}
                    </>
                )
            //指纹
            case "fingerprint":
                return (
                    <>
                        {fingerprintCollapseNode()}
                        {otherSettingCollapseNode()}
                    </>
                )
            // all SYN+指纹
            default:
                return (
                    <>
                        {synCollapseNode()}
                        {fingerprintCollapseNode()}
                        {otherSettingCollapseNode()}
                    </>
                )
        }
    })
    return (
        <div className={styles["port-scan-params-wrapper"]}>
            <Form.Item label='扫描模式' name='Mode' initialValue='fingerprint' extra='SYN 扫描需要 yak 启动时具有root'>
                <YakitRadioButtons
                    buttonStyle='solid'
                    options={ScanKindKeys.map((item) => ({
                        value: item,
                        label: ScanKind[item]
                    }))}
                />
            </Form.Item>
            <Form.Item label='扫描协议' name='scanProtocol' initialValue='tcp'>
                <YakitRadioButtons buttonStyle='solid' options={protoList} />
            </Form.Item>
            <YakitCollapse
                destroyInactivePanel={false}
                activeKey={activeKey}
                onChange={(key) => setActiveKey(key as string[])}
                bordered={false}
            >
                {renderContent()}
            </YakitCollapse>
        </div>
    )
})
