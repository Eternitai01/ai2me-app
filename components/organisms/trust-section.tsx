import { Badge } from "@/components/ui/badge"
import { Building2, Heart, Radio, Landmark } from "lucide-react"

export function TrustSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <h2 className="text-2xl lg:text-3xl font-bold">Trusted by Regulated Industries</h2>

          {/* Industry icons */}
          <div className="flex justify-center items-center gap-8 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <Landmark className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Banking</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Heart className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Healthcare</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Radio className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Telecom</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Building2 className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Government</span>
            </div>
          </div>

          {/* Compliance badges */}
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <Badge variant="outline" className="text-xs">
              ISO 27001
            </Badge>
            <Badge variant="outline" className="text-xs">
              SOC 2
            </Badge>
            <Badge variant="outline" className="text-xs">
              HIPAA
            </Badge>
            <Badge variant="outline" className="text-xs">
              GDPR
            </Badge>
            <Badge variant="outline" className="text-xs">
              CCPA
            </Badge>
          </div>

          {/* Security features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="font-semibold text-sm">AES-256 Encryption</div>
              <div className="text-xs text-muted-foreground">End-to-end security</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm">TLS 1.3</div>
              <div className="text-xs text-muted-foreground">Secure transmission</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm">Zero Trust</div>
              <div className="text-xs text-muted-foreground">Architecture</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
