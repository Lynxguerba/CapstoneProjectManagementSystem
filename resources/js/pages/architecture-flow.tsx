// Access URL: /architecture-flow
import '@xyflow/react/dist/style.css';
import type { Edge, Node} from '@xyflow/react';
import { Background, BackgroundVariant, Controls, MarkerType, MiniMap, ReactFlow, ReactFlowProvider } from '@xyflow/react';
import type { CSSProperties } from 'react';
import { useMemo } from 'react';

type LayerKey = 'entry' | 'routes' | 'middleware' | 'controllers' | 'services' | 'models' | 'response' | 'pages';

type FlowNodeData = {
    label: string;
    layer: LayerKey;
    color: string;
};

const layerPalette: Record<LayerKey, { label: string; color: string }> = {
    entry: { label: 'Browser / Inertia Client', color: '#38bdf8' },
    routes: { label: 'Routes', color: '#3b82f6' },
    middleware: { label: 'Middleware', color: '#818cf8' },
    controllers: { label: 'Controllers', color: '#10b981' },
    services: { label: 'Services', color: '#f59e0b' },
    models: { label: 'Models / Database', color: '#ef4444' },
    response: { label: 'Inertia Response', color: '#a855f7' },
    pages: { label: 'React Pages', color: '#22c55e' },
};

const buildNodeStyle = (color: string, width = 250): CSSProperties => ({
    width,
    borderRadius: 14,
    border: `1px solid ${color}`,
    background: 'linear-gradient(180deg, rgba(8,12,20,0.96) 0%, rgba(8,12,20,0.82) 100%)',
    color: '#e5e7eb',
    boxShadow: `0 0 0 1px ${color}30, 0 0 26px ${color}40, inset 0 0 16px ${color}24`,
    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: 11.5,
    letterSpacing: 0.1,
    whiteSpace: 'pre-line',
    padding: '10px 12px',
    lineHeight: 1.45,
});

const createNode = (id: string, label: string, x: number, y: number, layer: LayerKey, width?: number): Node<FlowNodeData> => {
    const color = layerPalette[layer].color;

    return {
        id,
        position: { x, y },
        data: { label, layer, color },
        style: buildNodeStyle(color, width),
        draggable: false,
    };
};

const nodes: Node<FlowNodeData>[] = [
    createNode('browser', 'Browser / Inertia Client\nReact + Inertia visit()', 760, 20, 'entry', 280),

    createNode('routesWeb', 'routes/web.php', 470, 190, 'routes'),
    createNode('routesApi', 'routes/api.php\n(API endpoints)', 1050, 190, 'routes'),

    createNode('middlewareAuth', 'auth', 300, 360, 'middleware', 190),
    createNode('middlewareRole', 'role:admin|adviser|instructor|panelist|student', 700, 360, 'middleware', 350),
    createNode('middlewareInertia', 'HandleInertiaRequests\n+ web middleware stack', 1200, 360, 'middleware', 280),

    createNode('controllerLogin', 'Auth\\LoginController\nstore/register/logout', 40, 560, 'controllers'),
    createNode('controllerAdmin', 'Admin\\AdminDashboardController', 320, 560, 'controllers'),
    createNode('controllerStudent', 'Student\\StudentDashboardController', 600, 560, 'controllers'),
    createNode('controllerInstructor', 'StoreDocumentRequirementController\nUpdateDocumentSubmissionStatusController', 880, 560, 'controllers', 290),
    createNode('controllerAdviser', 'Adviser\\AdviserLiveDefenseController', 1200, 560, 'controllers'),
    createNode('controllerPanelist', 'Panelist\\PanelistLiveDefenseController', 1480, 560, 'controllers'),

    createNode('servicePdf', 'PdfGeneratorService\n(mPDF / FPDI)', 280, 800, 'services'),
    createNode('serviceSignature', 'SignatureService\n(Cloudflare R2)', 760, 800, 'services'),
    createNode('serviceNotification', 'NotificationService', 1240, 800, 'services'),

    createNode('modelUser', 'User', 20, 1030, 'models', 180),
    createNode('modelProgramSet', 'ProgramSet', 240, 1030, 'models', 180),
    createNode('modelGroup', 'Group + GroupMember', 460, 1030, 'models', 210),
    createNode('modelDocumentSubmission', 'DocumentSubmission', 710, 1030, 'models', 220),
    createNode('modelDefenseSchedule', 'DefenseSchedule', 970, 1030, 'models', 210),
    createNode('modelLiveDefenseComment', 'LiveDefenseComment', 1220, 1030, 'models', 220),
    createNode('modelSiteWideNotification', 'SiteWideNotification', 1480, 1030, 'models', 230),

    createNode('databaseMysql', 'MySQL (Dockerized)', 540, 1220, 'models', 240),
    createNode('storageR2', 'Cloudflare R2 Storage', 930, 1220, 'models', 240),

    createNode('responseInertia', 'Inertia::render()', 360, 1420, 'response', 240),
    createNode('responseRedirect', 'redirect()->route()', 760, 1420, 'response', 240),
    createNode('responseJson', 'JSON Response\n(API / SPA partial data)', 1160, 1420, 'response', 290),

    createNode('pageLogin', 'resources/js/pages/login.tsx', 20, 1630, 'pages', 260),
    createNode('pageAdminDashboard', 'resources/js/pages/Admin/dashboard.tsx', 320, 1630, 'pages', 300),
    createNode('pageStudentDashboard', 'resources/js/pages/Student/dashboard.tsx', 660, 1630, 'pages', 320),
    createNode('pageInstructorDocuments', 'resources/js/pages/Instructor/requirements/documents-review.tsx', 1020, 1630, 'pages', 360),
    createNode('pageAdviserLiveDefense', 'resources/js/pages/Adviser/live-defense.tsx', 1420, 1630, 'pages', 320),
    createNode('pagePanelistLiveDefense', 'resources/js/pages/Panelist/live-defense.tsx', 1780, 1630, 'pages', 320),
];

const baseEdges: Edge[] = [
    { id: 'e1', source: 'browser', target: 'routesWeb' },
    { id: 'e2', source: 'browser', target: 'routesApi' },

    { id: 'e3', source: 'routesWeb', target: 'controllerLogin' },
    { id: 'e4', source: 'routesWeb', target: 'middlewareAuth' },
    { id: 'e5', source: 'routesWeb', target: 'middlewareInertia' },
    { id: 'e6', source: 'routesApi', target: 'middlewareAuth' },
    { id: 'e7', source: 'routesApi', target: 'responseJson' },

    { id: 'e8', source: 'middlewareAuth', target: 'middlewareRole' },
    { id: 'e9', source: 'middlewareRole', target: 'controllerAdmin' },
    { id: 'e10', source: 'middlewareRole', target: 'controllerStudent' },
    { id: 'e11', source: 'middlewareRole', target: 'controllerInstructor' },
    { id: 'e12', source: 'middlewareRole', target: 'controllerAdviser' },
    { id: 'e13', source: 'middlewareRole', target: 'controllerPanelist' },
    { id: 'e14', source: 'middlewareInertia', target: 'controllerAdmin' },
    { id: 'e15', source: 'middlewareInertia', target: 'controllerStudent' },
    { id: 'e16', source: 'middlewareInertia', target: 'controllerInstructor' },
    { id: 'e17', source: 'middlewareInertia', target: 'controllerAdviser' },
    { id: 'e18', source: 'middlewareInertia', target: 'controllerPanelist' },

    { id: 'e19', source: 'controllerLogin', target: 'modelUser' },
    { id: 'e20', source: 'controllerLogin', target: 'responseRedirect' },

    { id: 'e21', source: 'controllerAdmin', target: 'modelUser' },
    { id: 'e22', source: 'controllerAdmin', target: 'modelProgramSet' },
    { id: 'e23', source: 'controllerAdmin', target: 'modelGroup' },
    { id: 'e24', source: 'controllerAdmin', target: 'responseInertia' },

    { id: 'e25', source: 'controllerStudent', target: 'modelGroup' },
    { id: 'e26', source: 'controllerStudent', target: 'modelDocumentSubmission' },
    { id: 'e27', source: 'controllerStudent', target: 'modelDefenseSchedule' },
    { id: 'e28', source: 'controllerStudent', target: 'responseInertia' },

    { id: 'e29', source: 'controllerInstructor', target: 'modelProgramSet' },
    { id: 'e30', source: 'controllerInstructor', target: 'modelDocumentSubmission' },
    { id: 'e31', source: 'controllerInstructor', target: 'modelDefenseSchedule' },
    { id: 'e32', source: 'controllerInstructor', target: 'servicePdf' },
    { id: 'e33', source: 'controllerInstructor', target: 'serviceNotification' },
    { id: 'e34', source: 'controllerInstructor', target: 'responseInertia' },
    { id: 'e35', source: 'controllerInstructor', target: 'responseRedirect' },

    { id: 'e36', source: 'controllerAdviser', target: 'servicePdf' },
    { id: 'e37', source: 'controllerAdviser', target: 'serviceSignature' },
    { id: 'e38', source: 'controllerAdviser', target: 'serviceNotification' },
    { id: 'e39', source: 'controllerAdviser', target: 'modelLiveDefenseComment' },
    { id: 'e40', source: 'controllerAdviser', target: 'modelDefenseSchedule' },
    { id: 'e41', source: 'controllerAdviser', target: 'responseInertia' },

    { id: 'e42', source: 'controllerPanelist', target: 'serviceSignature' },
    { id: 'e43', source: 'controllerPanelist', target: 'serviceNotification' },
    { id: 'e44', source: 'controllerPanelist', target: 'modelLiveDefenseComment' },
    { id: 'e45', source: 'controllerPanelist', target: 'modelDefenseSchedule' },
    { id: 'e46', source: 'controllerPanelist', target: 'responseInertia' },

    { id: 'e47', source: 'servicePdf', target: 'modelDocumentSubmission' },
    { id: 'e48', source: 'servicePdf', target: 'storageR2' },
    { id: 'e49', source: 'serviceSignature', target: 'storageR2' },
    { id: 'e50', source: 'serviceNotification', target: 'modelSiteWideNotification' },

    { id: 'e51', source: 'modelUser', target: 'databaseMysql' },
    { id: 'e52', source: 'modelProgramSet', target: 'databaseMysql' },
    { id: 'e53', source: 'modelGroup', target: 'databaseMysql' },
    { id: 'e54', source: 'modelDocumentSubmission', target: 'databaseMysql' },
    { id: 'e55', source: 'modelDefenseSchedule', target: 'databaseMysql' },
    { id: 'e56', source: 'modelLiveDefenseComment', target: 'databaseMysql' },
    { id: 'e57', source: 'modelSiteWideNotification', target: 'databaseMysql' },

    { id: 'e58', source: 'databaseMysql', target: 'responseInertia' },
    { id: 'e59', source: 'databaseMysql', target: 'responseRedirect' },
    { id: 'e60', source: 'databaseMysql', target: 'responseJson' },
    { id: 'e61', source: 'storageR2', target: 'responseInertia' },

    { id: 'e62', source: 'responseInertia', target: 'pageLogin' },
    { id: 'e63', source: 'responseInertia', target: 'pageAdminDashboard' },
    { id: 'e64', source: 'responseInertia', target: 'pageStudentDashboard' },
    { id: 'e65', source: 'responseInertia', target: 'pageInstructorDocuments' },
    { id: 'e66', source: 'responseInertia', target: 'pageAdviserLiveDefense' },
    { id: 'e67', source: 'responseInertia', target: 'pagePanelistLiveDefense' },

    { id: 'e68', source: 'responseRedirect', target: 'pageLogin' },
    { id: 'e69', source: 'responseRedirect', target: 'pageAdminDashboard' },
    { id: 'e70', source: 'responseRedirect', target: 'pageStudentDashboard' },
];

const flowWireStyle: CSSProperties = {
    stroke: '#7f8ea7',
    strokeWidth: 1.6,
    filter: 'drop-shadow(0 0 5px rgba(148, 163, 184, 0.28))',
};

const miniMapStyle: CSSProperties = {
    backgroundColor: 'rgba(8, 12, 20, 0.92)',
    border: '1px solid #1e293b',
};

const legendPanelStyle: CSSProperties = {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 20,
    width: 270,
    borderRadius: 14,
    border: '1px solid rgba(148, 163, 184, 0.34)',
    background: 'linear-gradient(180deg, rgba(8,12,20,0.95) 0%, rgba(8,12,20,0.82) 100%)',
    boxShadow: '0 10px 40px rgba(2, 6, 23, 0.52)',
    padding: 12,
    color: '#d1d5db',
    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: 12,
    lineHeight: 1.5,
};

const titleBadgeStyle: CSSProperties = {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 20,
    borderRadius: 12,
    border: '1px solid rgba(148, 163, 184, 0.32)',
    background: 'rgba(8,12,20,0.88)',
    boxShadow: '0 8px 24px rgba(2, 6, 23, 0.5)',
    padding: '10px 12px',
    color: '#f3f4f6',
    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: 12,
    lineHeight: 1.45,
};

const legendItems: Array<{ label: string; color: string }> = [
    { label: layerPalette.routes.label, color: layerPalette.routes.color },
    { label: layerPalette.middleware.label, color: layerPalette.middleware.color },
    { label: layerPalette.controllers.label, color: layerPalette.controllers.color },
    { label: layerPalette.services.label, color: layerPalette.services.color },
    { label: layerPalette.models.label, color: layerPalette.models.color },
    { label: layerPalette.response.label, color: layerPalette.response.color },
    { label: layerPalette.pages.label, color: layerPalette.pages.color },
];

const proOptions = { hideAttribution: true };

export default function ArchitectureFlow() {
    const edges = useMemo<Edge[]>(() => {
        return baseEdges.map((edge) => ({
            ...edge,
            animated: true,
            type: 'smoothstep',
            style: flowWireStyle,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#7f8ea7',
            },
        }));
    }, []);

    return (
        <div
            style={{
                width: '100%',
                height: '100vh',
                background: '#080c14',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div style={titleBadgeStyle}>
                <div style={{ fontWeight: 700 }}>Laravel + Inertia Request Flow</div>
                <div style={{ opacity: 0.8 }}>Nginx / PHP-FPM / MySQL / Railway / R2</div>
            </div>

            <div style={legendPanelStyle}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Legend</div>
                {legendItems.map((item) => (
                    <div
                        key={item.label}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 6,
                        }}
                    >
                        <span
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                background: item.color,
                                boxShadow: `0 0 12px ${item.color}`,
                                display: 'inline-block',
                            }}
                        />
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>

            <ReactFlowProvider>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    fitView
                    fitViewOptions={{ padding: 0.15 }}
                    proOptions={proOptions}
                    minZoom={0.25}
                    maxZoom={1.8}
                    defaultEdgeOptions={{
                        animated: true,
                        type: 'smoothstep',
                    }}
                >
                    <Background color="#122034" gap={22} size={1.1} variant={BackgroundVariant.Dots} />
                    <MiniMap
                        pannable
                        zoomable
                        style={miniMapStyle}
                        nodeStrokeWidth={2}
                        nodeBorderRadius={4}
                        nodeColor={(node) => {
                            return (node.data as FlowNodeData | undefined)?.color ?? '#334155';
                        }}
                    />
                    <Controls
                        style={{
                            background: 'rgba(8, 12, 20, 0.92)',
                            border: '1px solid #334155',
                            boxShadow: '0 8px 24px rgba(2, 6, 23, 0.45)',
                        }}
                    />
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );
}
