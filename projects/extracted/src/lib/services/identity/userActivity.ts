import { Injectable } from '@angular/core';
import { TimeUtil } from '../../utils/timeUtil';

// This is the threshold for inactivity.
// If the user is inactive for this duration, we consider them inactive and log them out.
const INACTIVITY_THRESHOLD_IN_SECONDS = 5 * 60;

@Injectable({
  providedIn: 'root',
})
export class UserActivityService {
  protected lastActivityTimestampSeconds = 0;
  protected timeoutSeconds = 0;

  constructor() {
    this.registerActivity();
  }

  protected getLastActivityTimestampSeconds(): number {
    return this.lastActivityTimestampSeconds;
  }

  protected getRelativeActivitySeconds(): number {
    const currentTimestampSeconds = TimeUtil.getTimestampSeconds();
    return currentTimestampSeconds - this.lastActivityTimestampSeconds;
  }

  public reset(timeoutSeconds: number) {
    this.timeoutSeconds = timeoutSeconds;
  }

  public setInactivityTimeout(timeoutSeconds: number) {
    this.timeoutSeconds = timeoutSeconds;
  }

  public registerActivity() {
    this.lastActivityTimestampSeconds = TimeUtil.getTimestampSeconds();
  }

  public userIsInactive(): boolean {
    const relativeActivityTimestamp = this.getRelativeActivitySeconds();
    return relativeActivityTimestamp >= INACTIVITY_THRESHOLD_IN_SECONDS;
  }

  public userShouldRefreshToken(): boolean {
    if (this.userIsInactive()) {
      return false;
    }

    return true;
  }
}
