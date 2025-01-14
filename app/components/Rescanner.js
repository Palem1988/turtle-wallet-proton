// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { remote } from 'electron';
import log from 'electron-log';
import { il8n, session } from '../index';
import uiType from '../utils/uitype';

type Props = {
  darkMode: boolean
};

type State = {
  scanHeight: string,
  rescanInProgress: boolean
};

export default class Rescanner extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      scanHeight: '',
      rescanInProgress: false
    };
    this.setRescanInProgress = this.setRescanInProgress.bind(this);
    this.rescanWallet = this.rescanWallet.bind(this);
  }

  componentWillMount() {}

  componentWillUnmount() {}

  handleScanHeightChange = (event: any) => {
    this.setState({ scanHeight: event.target.value.trim() });
  };

  setRescanInProgress = (rescanInProgress: boolean) => {
    this.setState({
      rescanInProgress
    });
  };

  rescanWallet = async (event: any) => {
    event.preventDefault();
    this.setRescanInProgress(true);
    let fromStartHeight = false;
    let scanHeight = event.target[0].value;
    if (scanHeight === '') {
      scanHeight = parseInt(session.wallet.walletSynchronizer.startHeight, 10);
      fromStartHeight = true;
    } else {
      scanHeight = parseInt(event.target[0].value, 10);
    }
    if (Number.isNaN(scanHeight)) {
      log.debug('User provided invalid height.');
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['OK'],
        title: il8n.not_a_valid_number,
        message: il8n.please_enter_valid_number
      });
      this.setState({
        scanHeight: ''
      });
      this.setRescanInProgress(false);
      return;
    }
    const userConfirm = remote.dialog.showMessageBox(null, {
      type: 'warning',
      buttons: ['Cancel', 'OK'],
      title: 'This could take a while...',
      message:
        fromStartHeight === true
          ? `${il8n.about_to_rescan_beginning} ${scanHeight} ${
              il8n.about_to_rescan_end_1
            }`
          : `${il8n.about_to_rescan_beginning} ${scanHeight} ${
              il8n.about_to_rescan_end_2
            }`
    });
    if (userConfirm !== 1) {
      this.setRescanInProgress(false);
      return;
    }
    log.debug(`Resetting wallet from block ${scanHeight}`);
    this.setState({
      scanHeight: ''
    });
    await session.wallet.reset(scanHeight);
    remote.dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['OK'],
      title: `${il8n.reset_complete}`,
      message: `${il8n.syncing_again_from} ${scanHeight}.`
    });
    this.setRescanInProgress(false);
  };

  render() {
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    const { scanHeight, rescanInProgress } = this.state;

    return (
      <form onSubmit={this.rescanWallet}>
        <p className={`has-text-weight-bold ${textColor}`}>
          {il8n.rescan_wallet}
        </p>
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              className="input"
              type="text"
              placeholder="Enter a height to scan from..."
              value={scanHeight}
              onChange={this.handleScanHeightChange}
            />
          </div>
          <div className="control">
            <button
              className={`button is-danger ${
                rescanInProgress ? 'is-loading' : ''
              }`}
            >
              {il8n.rescan}
            </button>
          </div>
        </div>
      </form>
    );
  }
}
