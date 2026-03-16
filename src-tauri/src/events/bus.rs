use tokio::sync::broadcast;
use super::types::InternalEvent;

const EVENT_BUS_CAPACITY: usize = 256;

/// 应用内部事件总线，基于 tokio broadcast channel
#[derive(Clone)]
pub struct EventBus {
    tx: broadcast::Sender<InternalEvent>,
}

impl EventBus {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(EVENT_BUS_CAPACITY);
        Self { tx }
    }

    /// 发送内部事件
    pub fn emit(&self, event: InternalEvent) {
        // 忽略发送失败（没有订阅者时）
        let _ = self.tx.send(event);
    }

    /// 订阅内部事件
    pub fn subscribe(&self) -> broadcast::Receiver<InternalEvent> {
        self.tx.subscribe()
    }
}

impl Default for EventBus {
    fn default() -> Self {
        Self::new()
    }
}
