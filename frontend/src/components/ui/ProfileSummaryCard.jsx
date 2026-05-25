import Card, { CardBody, CardHeader } from './Card.jsx';

export default function ProfileSummaryCard({ profile }) {
  return (
    <Card>
      <CardHeader title={profile.fullName || 'Candidato'} description={profile.targetRole || 'Rol objetivo pendiente'} />
      <CardBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Senioridad estimada</p>
            <p className="mt-1 text-sm text-slate-900">{profile.estimatedSeniority || 'Pendiente'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Experiencia</p>
            <p className="mt-1 text-sm text-slate-900">{profile.yearsOfExperience ?? 'Pendiente'} anos</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Resumen</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{profile.professionalSummary || 'Sin resumen disponible.'}</p>
        </div>
      </CardBody>
    </Card>
  );
}
