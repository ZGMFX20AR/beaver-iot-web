import React, { useState } from 'react';
import { Step, StepButton, Stepper } from '@mui/material';
import { Modal } from '@milesight/shared/src/components';
import Connection, { type ConnectionResultType } from './component/connection';
import Review from './component/review';

interface IProps {
    visible: boolean;
    refreshTable: () => void;
    onCancel: () => void;
    onUpdateSuccess?: () => void;
}

const steps = ['Connection', 'Review & Confirm'];

/** Add Gateway wizard for the IRIV-IOC MQTT Gateway integration */
const AddGateway: React.FC<IProps> = ({ visible, refreshTable, onCancel, onUpdateSuccess }) => {
    const [activeStep, setActiveStep] = useState<number>(0);
    const [connectionResult, setConnectionResult] = useState<ConnectionResultType | null>(null);

    const handleNextStep = () => setActiveStep(prev => prev + 1);
    const handleBackStep = () => setActiveStep(prev => prev - 1);
    const handleStep = (step: number) => () => setActiveStep(step);

    const handleConnectionNext = (result: ConnectionResultType) => {
        setConnectionResult(result);
        handleNextStep();
    };

    const handleSuccess = () => {
        onCancel();
        refreshTable();
        onUpdateSuccess?.();
    };

    const stepComponentList = [
        {
            label: steps[0],
            component: (
                <Connection
                    data={connectionResult?.formData || null}
                    onCancel={onCancel}
                    onNext={handleConnectionNext}
                />
            ),
        },
        {
            label: steps[1],
            component: (
                <Review result={connectionResult} onBack={handleBackStep} onSuccess={handleSuccess} />
            ),
        },
    ];

    return (
        <Modal
            size="lg"
            visible={visible}
            title="Add Gateway"
            showCloseIcon
            onCancel={onCancel}
            footer={null}
        >
            <div className="ms-iriv-add-modal">
                <div className="ms-iriv-add-modal-stepper">
                    <Stepper nonLinear activeStep={activeStep}>
                        {stepComponentList.map(({ label }, index) => (
                            <Step key={label} completed={activeStep > index}>
                                <StepButton disabled color="contained" onClick={handleStep(index)}>
                                    {label}
                                </StepButton>
                            </Step>
                        ))}
                    </Stepper>
                </div>
                {stepComponentList[activeStep].component}
            </div>
        </Modal>
    );
};

export default AddGateway;
