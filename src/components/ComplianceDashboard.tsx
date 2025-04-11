"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts"
import { CheckCircle, AlertCircle, AlertTriangle, Download, Loader, Clock, BarChart2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import ComplianceReport from "./ComplianceReport"
import { generateGapRecommendations, analyzeComplianceData } from "../services/vertexAIService"

interface ComplianceDashboardProps {
  complianceData: any[]
  fileName: string

  // ADDED CODE: Accept cmmcLevel if you want to pass it in
  cmmcLevel?: "Level 1" | "Level 2" | "Level 3"
}

interface Practice {
  practiceId: string
  practiceName: string
  status: string
  score: number
  gap?: string
  recommendation?: string
}

const COLORS = {
  compliant: "#22c55e", // Green
  partial: "#eab308",   // Yellow
  nonCompliant: "#ef4444", // Red
  domain: "#3b82f6",    // Blue
  background: {
    compliant: "#f0fdf4",
    partial: "#fefce8",
    nonCompliant: "#fef2f2",
    domain: "#eff6ff",
  },
}

const DOMAIN_COLORS = {
  AC: "#3b82f6", 
  AM: "#8b5cf6", 
  AU: "#ec4899", 
  CM: "#f97316", 
  IA: "#14b8a6", 
  IR: "#ef4444", 
  MA: "#84cc16", 
  MP: "#06b6d4", 
  PS: "#f59e0b", 
  PE: "#6366f1", 
  RA: "#10b981", 
  CA: "#8b5cf6", 
  SC: "#0ea5e9", 
  SI: "#d946ef", 
  Unknown: "#6b7280", 
}

const getDomainColor = (domainId: string): string => {
  return DOMAIN_COLORS[domainId as keyof typeof DOMAIN_COLORS] || DOMAIN_COLORS.Unknown
}

/**
 * Processes compliance data to generate summary and domain scores
 */
const processComplianceData = (complianceData: any[] = []) => {
  const summary = {
    compliant: 0,
    partial: 0,
    nonCompliant: 0,
  }

  const domainMap = new Map()

  if (!Array.isArray(complianceData)) {
    return { summary, domainScores: [], overallScore: 0, priorityGaps: [] }
  }

  complianceData.forEach((item) => {
    if (item.status === "Compliant") summary.compliant += 1
    else if (item.status === "Partial") summary.partial += 1
    else summary.nonCompliant += 1

    const domainId = item.practiceId?.split(".")[0] || "Unknown"

    if (!domainMap.has(domainId)) {
      domainMap.set(domainId, {
        domainId,
        domainName: getDomainName(domainId),
        practices: [],
      })
    }

    domainMap.get(domainId).practices.push({
      practiceId: item.practiceId,
      practiceName: item.practiceName || `Practice ${item.practiceId}`,
      status: item.status?.toLowerCase() || "non-compliant",
      score: getScoreFromStatus(item.status),
      gap: item.gap || "",
      recommendation: item.recommendation || "",
    })
  })

  const domainScores = Array.from(domainMap.values()).map((domain) => {
    const practices = domain.practices
    const totalPractices = practices.length
    const compliantCount = practices.filter((p: { status: string }) => p.status === "compliant").length
    const partialCount = practices.filter((p: { status: string }) => p.status === "partial").length

    const compliancePercentage = totalPractices > 0
      ? ((compliantCount + partialCount * 0.5) / totalPractices) * 100
      : 0

    return {
      ...domain,
      compliancePercentage,
      statusCounts: {
        compliant: compliantCount,
        partial: partialCount,
        nonCompliant: totalPractices - compliantCount - partialCount,
      },
    }
  })

  const overallScore =
    domainScores.length > 0
      ? domainScores.reduce((sum, domain) => sum + domain.compliancePercentage, 0) / domainScores.length
      : 0

  const priorityGaps = complianceData
    .filter((item) => item.status !== "Compliant")
    .map((item) => ({
      practiceId: item.practiceId,
      practiceName: item.practiceName || `Practice ${item.practiceId}`,
      status: item.status?.toLowerCase() || "non-compliant",
      score: getScoreFromStatus(item.status),
      gap: item.gap || "Pending 3PAO assessment",
      recommendation: item.recommendation || "Implement controls to address this practice",
      severity: getSeverity(item.status, item.gap),
      threePAOAssessment: item.threePAOAssessment || "",
    }))
    .sort((a, b) => a.score - b.score)

  return { summary, domainScores, overallScore, priorityGaps }
}

const getScoreFromStatus = (status: string): number => {
  if (!status) return 0
  switch (status.toLowerCase()) {
    case "compliant":
      return 1
    case "partial":
      return 0.5
    default:
      return 0
  }
}

const getDomainName = (domainId: string): string => {
  const domainNames: { [key: string]: string } = {
    AC: "Access Control",
    AM: "Asset Management",
    AU: "Audit & Accountability",
    CM: "Configuration Management",
    IA: "Identification & Authentication",
    IR: "Incident Response",
    MA: "Maintenance",
    MP: "Media Protection",
    PS: "Personnel Security",
    PE: "Physical Protection",
    RA: "Risk Assessment",
    CA: "Security Assessment",
    SC: "System & Communications",
    SI: "System & Information Integrity",
  }
  return domainNames[domainId] || `Domain ${domainId}`
}

const getSeverity = (status: string, gap: string): string => {
  if (!status || status.toLowerCase() === "non-compliant") {
    return gap && gap.toLowerCase().includes("critical") ? "Critical" : "High"
  }
  return "Medium"
}

const DomainPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-sm">
        <p className="font-medium">{payload[0].payload.domainName}</p>
        <p>Non-Compliant Items: {payload[0].value}</p>
      </div>
    )
  }
  return null
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p>Count: {payload[0].value}</p>
      </div>
    )
  }
  return null
}

const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  complianceData = [],
  fileName = "No file",
  cmmcLevel = "Level 3", // ADDED CODE: default to 'Level 3'
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [threePAOAssessments, setThreePAOAssessments] = useState<Record<string, string>>({})
  const [isLoading3PAOAssessments, setIsLoading3PAOAssessments] = useState(false)

  const safeComplianceData = Array.isArray(complianceData) ? complianceData : []
  const { summary, domainScores, overallScore, priorityGaps } = processComplianceData(safeComplianceData)

  useEffect(() => {
    if (domainScores.length > 0 && !selectedDomain) {
      setSelectedDomain(domainScores[0].domainId)
    }
  }, [domainScores, selectedDomain])

  useEffect(() => {
    if (safeComplianceData.length > 0 && !aiRecommendations.length && !isLoadingRecommendations) {
      loadAiRecommendations()
    }
  }, [safeComplianceData])

  const loadAiRecommendations = async () => {
    setIsLoadingRecommendations(true)
    try {
      const recommendations = await generateGapRecommendations(safeComplianceData)
      setAiRecommendations(recommendations)
    } catch (error) {
      console.error("Error generating AI recommendations:", error)
    } finally {
      setIsLoadingRecommendations(false)
    }
  }

  const get3PAOAssessments = async () => {
    if (priorityGaps.length === 0) return

    setIsLoading3PAOAssessments(true)
    try {
      const gapsForAnalysis = priorityGaps
        .map((gap) => `${gap.practiceId},${gap.practiceName},${gap.status},${gap.gap || "No gap specified"}`)
        .join("\n")

      const csvWithHeader = `PracticeID,PracticeName,Status,Gap\n${gapsForAnalysis}`
      const findings = await analyzeComplianceData(csvWithHeader)

      const assessments: Record<string, string> = {}
      findings.forEach(
        (finding: {
          practiceId: string
          status?: string
          insights?: string
          threePAOAssessment?: string
        }) => {
          if (finding.practiceId && finding.practiceId !== "Error") {
            assessments[finding.practiceId] =
              finding.threePAOAssessment ||
              finding.insights ||
              "A 3PAO would require additional evidence and documentation to assess this control."
          }
        },
      )

      setThreePAOAssessments(assessments)
    } catch (error) {
      console.error("Error getting 3PAO assessments:", error)
    } finally {
      setIsLoading3PAOAssessments(false)
    }
  }

  useEffect(() => {
    if (priorityGaps.length > 0 && Object.keys(threePAOAssessments).length === 0 && !isLoading3PAOAssessments) {
      get3PAOAssessments()
    }
  }, [priorityGaps])

  const selectedDomainData = selectedDomain ? domainScores.find((domain) => domain.domainId === selectedDomain) : null

  const doughnutData = [
    { name: "Compliant", value: summary.compliant, color: COLORS.compliant },
    { name: "Partial", value: summary.partial, color: COLORS.partial },
    { name: "Non-Compliant", value: summary.nonCompliant, color: COLORS.nonCompliant },
  ]

  const domainPieData = domainScores
    .filter((domain) => domain.statusCounts.nonCompliant > 0)
    .map((domain) => ({
      name: domain.domainId,
      domainName: domain.domainName,
      value: domain.statusCounts.nonCompliant,
      compliancePercentage: domain.compliancePercentage,
      color: getDomainColor(domain.domainId),
    }))

  const handleExportCSV = () => {
    const headers = ["Practice ID", "Status", "Score", "Gap", "Recommendation"]
    const rows = complianceData.map((item) => [
      item.practiceId,
      item.status,
      getScoreFromStatus(item.status).toString(),
      item.gap || "",
      item.recommendation || "",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `cmmc-compliance-export-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "compliant":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "partial":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "non-compliant":
      default:
        return <AlertTriangle className="w-4 h-4 text-red-500" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>
      case "High":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">High</Badge>
      case "Medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Low</Badge>
    }
  }

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case "High":
        return <Badge className="bg-red-50 text-red-700 hover:bg-red-50">High Effort</Badge>
      case "Medium":
        return <Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">Medium Effort</Badge>
      case "Low":
        return <Badge className="bg-green-50 text-green-700 hover:bg-green-50">Low Effort</Badge>
      default:
        return null
    }
  }

  if (!safeComplianceData.length) {
    return <p className="text-gray-500 mt-4">No data available. Upload a CSV file.</p>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-700">CMMC Level {cmmcLevel} Compliance Dashboard</h3>
          <p className="text-sm text-gray-500">
            Analyzing data from <span className="font-medium">{fileName}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* AI-Generated Compliance Report */}
      <ComplianceReport complianceData={safeComplianceData} cmmcLevel={cmmcLevel} />

      {/* Overall compliance score card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Compliance Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/3 flex justify-center">
              <div className="relative">
                {/* Recharts warns about fixed width & height with ResponsiveContainer,
                    but we leave it for demonstration */}
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={doughnutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {doughnutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-gray-800">{Math.round(overallScore)}%</span>
                  <span className="text-sm text-gray-500">Compliant</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-2/3 mt-6 md:mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Compliant</span>
                    <span className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="font-medium">{summary.compliant}</span>
                    </span>
                  </div>
                  <div className="mt-2">
                    <Progress value={(summary.compliant / complianceData.length) * 100} className="h-2 bg-gray-200" />
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Partial</span>
                    <span className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="font-medium">{summary.partial}</span>
                    </span>
                  </div>
                  <div className="mt-2">
                    <Progress value={(summary.partial / complianceData.length) * 100} className="h-2 bg-gray-200" />
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Non-Compliant</span>
                    <span className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-red-500 mr-1" />
                      <span className="font-medium">{summary.nonCompliant}</span>
                    </span>
                  </div>
                  <div className="mt-2">
                    <Progress
                      value={(summary.nonCompliant / complianceData.length) * 100}
                      className="h-2 bg-gray-200"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-medium mb-2">Compliance Summary</h4>
                <p className="text-gray-600">
                  {overallScore >= 80
                    ? "Your organization is well-positioned for CMMC Level 3 compliance with minor improvements needed."
                    : overallScore >= 50
                      ? "Your organization has made progress toward CMMC Level 3 compliance but significant gaps remain."
                      : "Your organization requires substantial improvements to meet CMMC Level 3 compliance requirements."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain compliance scores */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Non-Compliance Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={domainPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
                  labelLine={true}
                >
                  {domainPieData.map((entry, index) => (
                    <Cell key={`domain-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<DomainPieTooltip />} />
                <Legend
                  formatter={(value) => {
                    const domain = domainScores.find((d) => d.domainId === value)
                    return domain ? `${value}: ${domain.domainName}` : value
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {domainScores.map((domain: any, index: number) => (
              // ADDED CODE: use domain.domainId + index for a guaranteed unique key
              <Button
                key={`${domain.domainId}-${index}`}
                variant="outline"
                className={`p-3 h-auto justify-start flex-col items-start ${
                  selectedDomain === domain.domainId
                    ? "bg-blue-100 border-blue-300"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedDomain(domain.domainId)}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">{domain.domainId}</span>
                  <div className="flex items-center">
                    <span
                      className={`text-sm font-medium ${
                        domain.compliancePercentage >= 80
                          ? "text-green-600"
                          : domain.compliancePercentage >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {Math.round(domain.compliancePercentage)}%
                    </span>
                    {domain.statusCounts.nonCompliant > 0 && (
                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full">
                        {domain.statusCounts.nonCompliant}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate text-left w-full">{domain.domainName}</p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedDomainData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>
              {selectedDomainData.domainId}: {selectedDomainData.domainName}
            </CardTitle>
            <Badge
              className={`${
                selectedDomainData.compliancePercentage >= 80
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : selectedDomainData.compliancePercentage >= 50
                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                    : "bg-red-100 text-red-800 hover:bg-red-100"
              }`}
            >
              {Math.round(selectedDomainData.compliancePercentage)}% Compliant
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Status Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Compliant
                    </span>
                    <span className="font-medium">{selectedDomainData.statusCounts.compliant}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" /> Partially Compliant
                    </span>
                    <span className="font-medium">{selectedDomainData.statusCounts.partial}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm text-gray-600">
                      <AlertTriangle className="w-4 h-4 text-red-500 mr-2" /> Non-Compliant
                    </span>
                    <span className="font-medium">{selectedDomainData.statusCounts.nonCompliant}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Practice details table */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">Practice Details</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Practice ID</TableHead>
                      <TableHead>Practice Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Gap</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDomainData.practices.map((practice: Practice, index: number) => (
                      // ADDED CODE: ensure unique key by appending row index
                      <TableRow key={`${practice.practiceId}-${index}`}>
                        <TableCell className="font-medium">{practice.practiceId}</TableCell>
                        <TableCell>{practice.practiceName}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getStatusIcon(practice.status)}
                            <span className="ml-2 capitalize">{practice.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>{practice.gap || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI-Powered Priority Gaps section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>AI-Powered Priority Gaps</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRecommendations ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-500">Vertex AI is analyzing your compliance gaps...</p>
            </div>
          ) : aiRecommendations.length > 0 ? (
            <div className="space-y-4">
              {aiRecommendations.slice(0, 5).map((gap, index) => (
                <div key={gap.practiceId} className="border rounded-md p-4">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {gap.practiceId}: {gap.practiceName}
                        </h4>
                        <p className="text-sm text-red-600 mt-1">{gap.gap}</p>
                      </div>
                    </div>
                    <div className="flex items-center">{getSeverityBadge(gap.threatLevel)}</div>
                  </div>
                  <div className="mt-3 pl-9">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {gap.timeframe}
                      </div>
                      {gap.estimatedEffort && getEffortBadge(gap.estimatedEffort)}
                    </div>
                    <h5 className="text-sm font-medium text-gray-700">AI Recommendation:</h5>
                    <p className="text-sm text-gray-600 mb-2">{gap.aiRecommendation}</p>
                    <h5 className="text-sm font-medium text-gray-700">Potential Impact:</h5>
                    <p className="text-sm text-gray-600">{gap.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : priorityGaps.length > 0 ? (
            <div className="space-y-4">
              {priorityGaps.slice(0, 5).map((gap, index) => (
                <div key={gap.practiceId} className="border rounded-md p-4">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {gap.practiceId}: {gap.practiceName}
                        </h4>
                        <p className="text-sm text-red-600 mt-1">{gap.gap}</p>
                      </div>
                    </div>
                    <div className="flex items-center">{getSeverityBadge(gap.severity)}</div>
                  </div>
                  <div className="mt-3 pl-9">
                    {isLoading3PAOAssessments ? (
                      <div className="flex items-center text-sm text-gray-500">
                        <Loader className="w-3 h-3 mr-2 animate-spin" />
                        Loading 3PAO assessment...
                      </div>
                    ) : (
                      <>
                        <h5 className="text-sm font-medium text-gray-700">3PAO Assessment:</h5>
                        <p className="text-sm text-gray-600 mb-2">
                          {threePAOAssessments[gap.practiceId] ||
                            "A 3PAO would require additional evidence to fully assess this control gap."}
                        </p>
                      </>
                    )}
                    <h5 className="text-sm font-medium text-gray-700">Recommendation:</h5>
                    <p className="text-sm text-gray-600">{gap.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No priority gaps identified.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ComplianceDashboard
