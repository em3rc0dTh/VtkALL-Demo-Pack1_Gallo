import { useState, useEffect } from 'react';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { IntakeProgress } from './IntakeProgress';
import { CustomerForm } from '../customer/CustomerForm';
import { CustomerSummary } from '../customer/CustomerSummary';
import { ManagedEntityForm } from '../managed-entity/ManagedEntityForm';
import { ManagedEntitySummary } from '../managed-entity/ManagedEntitySummary';
import { CaseForm } from '../case/CaseForm';
import { CaseSummary } from '../case/CaseSummary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import { useCreateCustomer } from '@/hooks/server-state/useCustomerMutations';
import { useCreateManagedEntity } from '@/hooks/server-state/useManagedEntityMutations';
import { useCreateCase } from '@/hooks/server-state/useCaseMutations';

export function DemoTestIntakeFlow({ onComplete }) {
  const { profile } = useBusinessProfile();
  
  const [activeStepId, setActiveStepId] = useState('customer');

  // Mutations
  const createCustomer = useCreateCustomer();
  const createManagedEntity = useCreateManagedEntity();
  const createCase = useCreateCase();

  // Derived state
  const customer = createCustomer.data?.customer ?? null;
  const isCustomerReused = createCustomer.data?.reused === true;
  
  const managedEntity = createManagedEntity.data?.managedEntity ?? null;
  const activeCase = createCase.data?.case ?? null;

  const steps = [
    { id: 'customer', title: profile.labels.customer },
    { id: 'managedEntity', title: profile.labels.managedEntity },
    { id: 'case', title: profile.labels.case }
  ];

  // Actions
  const handleEditCustomer = () => {
    setActiveStepId('customer');
    createCustomer.reset();
    createManagedEntity.reset();
    createCase.reset();
  };

  const handleEditManagedEntity = () => {
    setActiveStepId('managedEntity');
    createManagedEntity.reset();
    createCase.reset();
  };

  const handleEditCase = () => {
    setActiveStepId('case');
    createCase.reset();
  };

  // Step progression
  const handleCustomerSubmit = (payload) => {
    createCustomer.mutate(payload, {
      onSuccess: () => setActiveStepId('managedEntity')
    });
  };

  const handleManagedEntitySubmit = (payload) => {
    createManagedEntity.mutate(payload, {
      onSuccess: () => setActiveStepId('case')
    });
  };

  const handleCaseSubmit = (payload) => {
    createCase.mutate(payload, {
      onSuccess: (data) => {
        if (onComplete) onComplete(data.case);
      }
    });
  };

  return (
    <div className="space-y-6">
      <IntakeProgress steps={steps} activeStepId={activeStepId} />

      <Card>
        <CardHeader>
          <CardTitle>Datos Operacionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Customer Step */}
          <div>
            {!customer && activeStepId === 'customer' ? (
              <CustomerForm
                businessSlug={profile.businessSlug}
                title={`Registrar ${profile.labels.customer}`}
                onSubmit={handleCustomerSubmit}
                isPending={createCustomer.isPending}
                error={createCustomer.error}
              />
            ) : customer ? (
              <CustomerSummary 
                customer={customer} 
                isReused={isCustomerReused} 
                onEdit={handleEditCustomer} 
              />
            ) : null}
          </div>

          {/* ManagedEntity Step */}
          <div>
            {!managedEntity && activeStepId === 'managedEntity' && customer ? (
              <ManagedEntityForm
                businessSlug={profile.businessSlug}
                customerId={customer._id}
                verticalType={profile.verticalType}
                title={`Registrar ${profile.labels.managedEntity}`}
                onSubmit={handleManagedEntitySubmit}
                isPending={createManagedEntity.isPending}
                error={createManagedEntity.error}
              />
            ) : managedEntity ? (
              <ManagedEntitySummary 
                entity={managedEntity} 
                onEdit={handleEditManagedEntity} 
              />
            ) : null}
          </div>

          {/* Case Step */}
          <div>
            {!activeCase && activeStepId === 'case' && customer && managedEntity ? (
              <CaseForm
                businessSlug={profile.businessSlug}
                verticalType={profile.verticalType}
                customerId={customer._id}
                managedEntityId={managedEntity._id}
                title={`Crear ${profile.labels.case}`}
                onSubmit={handleCaseSubmit}
                isPending={createCase.isPending}
                error={createCase.error}
              />
            ) : activeCase ? (
              <CaseSummary 
                caseObj={activeCase} 
                onEdit={handleEditCase} 
              />
            ) : null}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
