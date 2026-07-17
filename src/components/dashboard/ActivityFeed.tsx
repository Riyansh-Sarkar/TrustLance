import { useEffect, useState } from "react";
import { getTransactionEvents } from "@/lib/firebase/growth";
import { TransactionEvent } from "@/types/growth";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Activity, CheckCircle2, ShieldAlert, Rocket, ArrowRightLeft } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";

export function ActivityFeed({ contractId }: { contractId: string }) {
  const [events, setEvents] = useState<TransactionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const data = await getTransactionEvents(contractId);
        if (mounted) {
          setEvents(data);
        }
      } catch (error) {
        console.error("Failed to fetch activity events", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    fetchEvents();
    
    return () => { mounted = false; };
  }, [contractId]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "contract_accepted": return <CheckCircle2 className="w-4 h-4 text-accent" />;
      case "escrow_funded": return <Rocket className="w-4 h-4 text-accent" />;
      case "milestone_submitted": return <ArrowRightLeft className="w-4 h-4 text-ink-primary" />;
      case "milestone_approved": return <CheckCircle2 className="w-4 h-4 text-accent" />;
      case "dispute_raised": return <ShieldAlert className="w-4 h-4 text-status-disputed" />;
      case "dispute_resolved": return <ShieldAlert className="w-4 h-4 text-status-disputed" />;
      default: return <Activity className="w-4 h-4 text-ink-tertiary" />;
    }
  };

  const formatEventName = (type: string) => {
    return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  if (isLoading) {
    return (
      <div className="bg-bg-base border border-edge-neutral p-6 rounded-[20px] shadow-sm animate-pulse">
        <div className="h-4 bg-edge-neutral w-32 mb-6 rounded-md" />
        <div className="space-y-4">
          <div className="h-10 bg-edge-neutral w-full rounded-md" />
          <div className="h-10 bg-edge-neutral w-full rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-base border border-edge-neutral p-6 rounded-[20px] shadow-sm">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-edge-neutral">
        <Activity className="w-4 h-4 text-ink-secondary" />
        <h3 className="font-ui-label text-ink-primary font-semibold uppercase tracking-wider text-xs">Activity Feed</h3>
      </div>
      
      {events.length === 0 ? (
        <p className="font-mono-data text-ink-tertiary text-xs">No activity recorded yet.</p>
      ) : (
        <div className="space-y-4 relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-edge-neutral z-0" />
          <AnimatePresence>
            {events.map((event, i) => (
              <m.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={event.id || i} 
                className="relative z-10 flex gap-4 items-start"
              >
                <div className="w-6 h-6 rounded-full bg-bg-base border border-edge-neutral flex items-center justify-center shrink-0 mt-0.5">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-ui-label text-sm font-semibold text-ink-primary">
                      {formatEventName(event.type)}
                    </p>
                    <span className="font-mono-data text-[10px] text-ink-tertiary">
                      {event.timestamp ? formatDistanceToNow(event.timestamp instanceof Date ? event.timestamp : (event.timestamp as any).toDate?.() || event.timestamp, { addSuffix: true }) : "Just now"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono-data text-[10px] text-ink-secondary bg-bg-void px-2 py-0.5 rounded-md border border-edge-neutral">
                      {event.walletAddress.substring(0, 6)}...{event.walletAddress.substring(event.walletAddress.length - 4)}
                    </span>
                    {event.txHash && (
                      <a 
                        href={`https://stellar.expert/explorer/testnet/tx/${event.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 font-mono-data text-[10px] text-accent hover:underline font-medium"
                      >
                        View Tx <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
