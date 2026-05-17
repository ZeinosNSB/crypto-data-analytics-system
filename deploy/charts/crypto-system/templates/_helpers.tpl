{{/*
Expand the name of the chart.
*/}}
{{- define "crypto-system.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "crypto-system.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "crypto-system.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "crypto-system.labels" -}}
helm.sh/chart: {{ include "crypto-system.chart" . }}
{{ include "crypto-system.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "crypto-system.selectorLabels" -}}
app.kubernetes.io/name: {{ include "crypto-system.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "crypto-system.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "crypto-system.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create a component-specific fullname.
Usage:
{{ include "crypto-system.componentFullname" (dict "root" . "component" "api") }}
*/}}
{{- define "crypto-system.componentFullname" -}}
{{- $root := .root -}}
{{- $component := .component -}}
{{- printf "%s-%s" (include "crypto-system.fullname" $root) $component | trunc 63 | trimSuffix "-" -}}
{{- end }}

{{/*
Create selector labels for a specific component.
*/}}
{{- define "crypto-system.componentSelectorLabels" -}}
{{ include "crypto-system.selectorLabels" .root }}
app.kubernetes.io/component: {{ .component }}
{{- end }}
