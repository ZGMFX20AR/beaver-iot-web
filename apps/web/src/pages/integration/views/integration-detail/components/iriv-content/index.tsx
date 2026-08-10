import React from 'react';
import Config from './config';

interface IProps {
    onUpdateSuccess?: () => void;
}

/** IRIV-IOC MQTT Gateway integration detail page */
const IrivContent: React.FC<IProps> = ({ onUpdateSuccess }) => {
    return <Config onUpdateSuccess={onUpdateSuccess} />;
};

export default IrivContent;
