export type YakRunnerAuditEventProps = {
    onCodeAuditJumpEditorDetail: string
    onCodeAuditOpenBottomDetail: string
    onCodeAuditRefreshAduitHistory?: string
    // 重新设置文件树缓存（展开 点击 多选）
    onCodeAuditResetFileTree?: string
    // 刷新文件树
    onCodeAuditRefreshFileTree?: string
    // 展开文件树
    onCodeAuditExpandedFileTree: string
    // 关闭打开的文件
    onCodeAuditCloseFile: string
    // 定位文件树
    onCodeAuditScrollToFileTree: string
    // 默认展开文件树
    onCodeAuditDefaultExpanded: string
    // 通过路径打开文件
    onCodeAuditOpenFileByPath: string
    // 打开编译文件Modal
    onExecuteAuditModal?: string
    // 打开编译右侧详情
    onCodeAuditOpenRightDetail: string
    // 打开审计树
    onCodeAuditOpenAuditTree: string
    // 刷新树
    onCodeAuditRefreshTree?: string
    // 刷新审计详情（关闭节点信息）
    onCodeAuditRefreshAuditDetail?: string
}