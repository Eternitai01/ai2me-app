"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Search,
  Filter,
  Lock,
  Globe,
  Database,
} from "lucide-react"

// Import new blockchain components
import { ComplianceStatusCard } from "@/components/organisms/compliance-status-card"
import { TransactionVerificationPanel } from "@/components/organisms/transaction-verification-panel"
import { AuditTrailViewer } from "@/components/organisms/audit-trail-viewer"
import { ComplianceAnalyticsDashboard } from "@/components/organisms/compliance-analytics-dashboard"
import { RealTimeBlockchainMonitor } from "@/components/organisms/real-time-blockchain-monitor"
import { BlockchainManagementInterface } from "@/components/organisms/blockchain-management-interface"
import { TransactionSearchAnalytics } from "@/components/organisms/transaction-search-analytics"
import { useBlockchainData } from "@/hooks/use-blockchain-data"

export default function CompliancePage() {
  const [auditFilter, setAuditFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Use blockchain data hook for real-time data
  const {
    complianceStatus,
    complianceLoading,
    complianceError,
    refreshCompliance,
    transactionVerifications,
    verificationsLoading,
    verificationsError,
    refreshVerifications,
    updateTransactionStatuses,
    syncBlockchain,
    updateVerificationFilters,
    auditTrail,
    auditLoading,
    auditError,
    refreshAuditTrail,
    updateAuditFilters,
    lastUpdated,
  } = useBlockchainData()

  // Mock compliance data
  const complianceFrameworks = [
    {
      name: "SOC 2 Type II",
      status: "compliant",
      lastAudit: "2024-01-15",
      nextAudit: "2024-07-15",
      score: 98,
      requirements: 45,
      completed: 44,
    },
    {
      name: "HIPAA",
      status: "compliant",
      lastAudit: "2023-12-10",
      nextAudit: "2024-06-10",
      score: 96,
      requirements: 32,
      completed: 31,
    },
    {
      name: "GDPR",
      status: "compliant",
      lastAudit: "2024-01-20",
      nextAudit: "2024-07-20",
      score: 94,
      requirements: 28,
      completed: 26,
    },
    {
      name: "PCI DSS",
      status: "in-progress",
      lastAudit: "2023-11-30",
      nextAudit: "2024-05-30",
      score: 87,
      requirements: 35,
      completed: 30,
    },
  ]

  const auditLogs = [
    {
      id: "audit-001",
      timestamp: "2024-01-27 14:32:15",
      user: "john.doe@acme.com",
      action: "API Key Generated",
      resource: "api-key-prod-001",
      ip: "192.168.1.100",
      location: "New York, US",
      status: "success",
      details: "Generated new production API key with read/write permissions",
    },
    {
      id: "audit-002",
      timestamp: "2024-01-27 14:28:42",
      user: "jane.smith@acme.com",
      action: "Data Export",
      resource: "customer-data-batch-001",
      ip: "192.168.1.101",
      location: "New York, US",
      status: "success",
      details: "Exported customer data for compliance reporting",
    },
    {
      id: "audit-003",
      timestamp: "2024-01-27 14:15:33",
      user: "system",
      action: "Data Retention",
      resource: "logs-2023-12",
      ip: "internal",
      location: "US-East-1",
      status: "success",
      details: "Automated deletion of logs older than 12 months",
    },
    {
      id: "audit-004",
      timestamp: "2024-01-27 13:45:21",
      user: "bob.johnson@acme.com",
      action: "Access Denied",
      resource: "admin-panel",
      ip: "192.168.1.102",
      location: "New York, US",
      status: "failed",
      details: "Attempted access to admin panel without sufficient permissions",
    },
  ]

  const dataGovernance = [
    {
      category: "Data Classification",
      status: "compliant",
      policies: 12,
      lastReview: "2024-01-15",
    },
    {
      category: "Data Retention",
      status: "compliant",
      policies: 8,
      lastReview: "2024-01-10",
    },
    {
      category: "Data Access Controls",
      status: "review-needed",
      policies: 15,
      lastReview: "2023-12-20",
    },
    {
      category: "Data Encryption",
      status: "compliant",
      policies: 6,
      lastReview: "2024-01-20",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "default"
      case "in-progress":
        return "secondary"
      case "review-needed":
        return "destructive"
      case "success":
        return "default"
      case "failed":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "in-progress":
        return <Clock className="h-4 w-4" />
      case "review-needed":
      case "failed":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Compliance Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Comprehensive compliance monitoring, audit trails, and regulatory reporting for enterprise security.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blockchain Score</p>
                <p className="text-2xl font-bold">
                  {complianceStatus ? `${complianceStatus.overallScore.toFixed(1)}%` : '---'}
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <Progress
              value={complianceStatus?.overallScore || 0}
              className="mt-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified Transactions</p>
                <p className="text-2xl font-bold">
                  {complianceStatus ? complianceStatus.verifiedTransactions.toLocaleString() : '---'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              of {complianceStatus ? complianceStatus.totalTransactions.toLocaleString() : '---'} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Tiers</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Database className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">S3, Azure ACL, Polygon</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-2xl font-bold">
                  {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {lastUpdated ? lastUpdated.toLocaleDateString() : 'Never'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="blockchain" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden h-auto p-1 bg-muted/50 scrollbar-hide flex-nowrap whitespace-nowrap">
          <TabsTrigger value="blockchain" className="flex-shrink-0">Blockchain</TabsTrigger>
          <TabsTrigger value="analytics" className="flex-shrink-0">Analytics</TabsTrigger>
          <TabsTrigger value="monitor" className="flex-shrink-0">Monitor</TabsTrigger>
          <TabsTrigger value="manage" className="flex-shrink-0">Manage</TabsTrigger>
          <TabsTrigger value="search" className="flex-shrink-0">Search</TabsTrigger>
          <TabsTrigger value="frameworks" className="flex-shrink-0">Frameworks</TabsTrigger>
          <TabsTrigger value="governance" className="flex-shrink-0">Governance</TabsTrigger>
          <TabsTrigger value="reports" className="flex-shrink-0">Reports</TabsTrigger>
        </TabsList>

        {/* Blockchain Compliance */}
        <TabsContent value="blockchain" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComplianceStatusCard
              complianceStatus={complianceStatus}
              loading={complianceLoading}
              error={complianceError}
              onRefresh={refreshCompliance}
            />
            <TransactionVerificationPanel
              transactions={transactionVerifications}
              loading={verificationsLoading}
              error={verificationsError}
              onRefresh={refreshVerifications}
              onUpdateStatus={updateTransactionStatuses}
              onSyncBlockchain={syncBlockchain}
              onUpdateFilters={updateVerificationFilters}
            />
          </div>
          <AuditTrailViewer
            auditTrail={auditTrail}
            loading={auditLoading}
            error={auditError}
            onRefresh={refreshAuditTrail}
            onUpdateFilters={updateAuditFilters}
          />
        </TabsContent>

        {/* Analytics Dashboard */}
        <TabsContent value="analytics" className="space-y-6">
          <ComplianceAnalyticsDashboard />
        </TabsContent>

        {/* Real-Time Monitor */}
        <TabsContent value="monitor" className="space-y-6">
          <RealTimeBlockchainMonitor />
        </TabsContent>

        {/* Management Interface */}
        <TabsContent value="manage" className="space-y-6">
          <BlockchainManagementInterface />
        </TabsContent>

        {/* Transaction Search */}
        <TabsContent value="search" className="space-y-6">
          <TransactionSearchAnalytics />
        </TabsContent>

        {/* Compliance Frameworks */}
        <TabsContent value="frameworks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Frameworks</CardTitle>
              <CardDescription>Monitor your compliance status across different regulatory frameworks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceFrameworks.map((framework, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(framework.status)}
                      <div>
                        <div className="font-semibold">{framework.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {framework.completed}/{framework.requirements} requirements met
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">{framework.score}%</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{framework.nextAudit}</div>
                        <div className="text-xs text-muted-foreground">Next Audit</div>
                      </div>
                      <Badge variant={getStatusColor(framework.status)}>{framework.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="audit-logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Complete audit log of all system activities and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search audit logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={auditFilter} onValueChange={setAuditFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="success">Success Only</SelectItem>
                    <SelectItem value="failed">Failed Only</SelectItem>
                    <SelectItem value="api">API Events</SelectItem>
                    <SelectItem value="data">Data Events</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b text-muted-foreground/70 text-xs uppercase tracking-wider">
                      <th className="text-left py-3 font-semibold">Timestamp</th>
                      <th className="text-left py-3 font-semibold">User</th>
                      <th className="text-left py-3 font-semibold">Action</th>
                      <th className="text-left py-3 font-semibold">Resource</th>
                      <th className="text-left py-3 font-semibold">Location</th>
                      <th className="text-left py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 text-sm font-mono">{log.timestamp}</td>
                        <td className="py-3">{log.user}</td>
                        <td className="py-3">{log.action}</td>
                        <td className="py-3 font-mono text-sm">{log.resource}</td>
                        <td className="py-3 text-sm">{log.location}</td>
                        <td className="py-3">
                          <Badge variant={getStatusColor(log.status)}>{log.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Governance */}
        <TabsContent value="governance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Governance</CardTitle>
              <CardDescription>Manage data policies, classification, and access controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dataGovernance.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        <div className="font-semibold">{item.category}</div>
                      </div>
                      <Badge variant={getStatusColor(item.status)}>{item.status}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>Policies: {item.policies}</div>
                      <div>Last Review: {item.lastReview}</div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                      Review Policies
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Protection</CardTitle>
              <CardDescription>Encryption, access controls, and data security measures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <Lock className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="font-semibold">Encryption</div>
                  <div className="text-sm text-muted-foreground">AES-256 at rest</div>
                  <div className="text-sm text-muted-foreground">TLS 1.3 in transit</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-semibold">Access Control</div>
                  <div className="text-sm text-muted-foreground">Role-based permissions</div>
                  <div className="text-sm text-muted-foreground">Multi-factor auth</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Globe className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="font-semibold">Data Residency</div>
                  <div className="text-sm text-muted-foreground">US, EU regions</div>
                  <div className="text-sm text-muted-foreground">Compliance zones</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>Generate and download compliance reports for auditors and regulators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">SOC 2 Report</div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Comprehensive security and availability report
                  </div>
                  <Button size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">GDPR Compliance</div>
                  <div className="text-sm text-muted-foreground mb-3">Data processing and privacy compliance</div>
                  <Button size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Audit Trail Export</div>
                  <div className="text-sm text-muted-foreground mb-3">Complete audit log for specified period</div>
                  <Button size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Logs
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Risk Assessment</div>
                  <div className="text-sm text-muted-foreground mb-3">Security risk analysis and recommendations</div>
                  <Button size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Data Inventory</div>
                  <div className="text-sm text-muted-foreground mb-3">Complete data classification and mapping</div>
                  <Button size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Custom Report</div>
                  <div className="text-sm text-muted-foreground mb-3">Build custom compliance reports</div>
                  <Button size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Create Custom
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
