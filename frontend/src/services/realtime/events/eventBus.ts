// Simple event bus implementation
type EventHandler = (...args: any[]) => void;

class EventBus {
  private events: Record<string, EventHandler[]> = {};

  subscribe(event: string, callback: EventHandler): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  publish(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args));
    }
  }

  clear(event?: string) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

export const eventBus = new EventBus();
