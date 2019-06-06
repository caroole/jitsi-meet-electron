// @flow

import moment from 'moment';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';
import { push } from 'react-router-redux';
import { convertForTrans } from '../../utils';

import {
    ConferenceCard,
    ConferenceTitle,
    RecentListContainer,
    TruncatedText
} from '../styled';
import type { RecentListItem } from '../types';

moment.locale('zh-cn', {
    months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
    monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
    weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split('_'),
    weekdaysShort: '周日_周一_周二_周三_周四_周五_周六'.split('_'),
    weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
    longDateFormat: {
        LT: 'HH:mm',
        LTS: 'HH:mm:ss',
        L: 'YYYY-MM-DD',
        LL: 'YYYY年MM月DD日',
        LLL: 'YYYY年MM月DD日Ah点mm分',
        LLLL: 'YYYY年MM月DD日ddddAh点mm分',
        l: 'YYYY-M-D',
        ll: 'YYYY年M月D日',
        lll: 'YYYY年M月D日 HH:mm',
        llll: 'YYYY年M月D日dddd HH:mm'
    },
    meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
    meridiemHour: function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === '凌晨' || meridiem === '早上' ||
            meridiem === '上午') {
            return hour;
        } else if (meridiem === '下午' || meridiem === '晚上') {
            return hour + 12;
        } else {
            // '中午'
            return hour >= 11 ? hour : hour + 12;
        }
    },
    meridiem: function (hour, minute, isLower) {
        const hm = hour * 100 + minute;
        if (hm < 600) {
            return '凌晨';
        } else if (hm < 900) {
            return '早上';
        } else if (hm < 1130) {
            return '上午';
        } else if (hm < 1230) {
            return '中午';
        } else if (hm < 1800) {
            return '下午';
        } else {
            return '晚上';
        }
    },
    calendar: {
        sameDay: '[今天]LT',
        nextDay: '[明天]LT',
        nextWeek: '[下]ddddLT',
        lastDay: '[昨天]LT',
        lastWeek: '[上]ddddLT',
        sameElse: 'L'
    },
    dayOfMonthOrdinalParse: /\d{1,2}(日|月|周)/,
    ordinal: function (number, period) {
        switch (period) {
            case 'd':
            case 'D':
            case 'DDD':
                return number + '日';
            case 'M':
                return number + '月';
            case 'w':
            case 'W':
                return number + '周';
            default:
                return number;
        }
    },
    relativeTime: {
        future: '%s内',
        past: '%s前',
        s: '几秒',
        ss: '%d秒',
        m: '1分钟',
        mm: '%d分钟',
        h: '1小时',
        hh: '%d小时',
        d: '1天',
        dd: '%d天',
        M: '1个月',
        MM: '%d个月',
        y: '1年',
        yy: '%d年'
    },
    week: {
        // GB/T 7408-1994《数据元和交换格式·信息交换·日期和时间表示法》与ISO 8601:1988等效
        dow: 1, // Monday is the first day of the week.
        doy: 4  // The week that contains Jan 4th is the first week of the year.
    }
});

type Props = {

    /**
     * Redux dispatch.
     */
    dispatch: Dispatch<*>;

    /**
     * Array of recent conferences.
     */
    _recentList: Array<RecentListItem>;
};

/**
 * Recent List Component.
 */
class RecentList extends Component<Props, *> {
    /**
     * Render function of component.
     *
     * @returns {ReactElement}
     */
    render() {
        return (
            <RecentListContainer>
                {
                    this.props._recentList.map(
                        conference => this._renderRecentListEntry(conference)
                    )
                }
            </RecentListContainer>
        );
    }

    /**
     * Creates a handler for navigatint to a conference.
     *
     * @param {RecentListItem} conference - Conference Details.
     * @returns {void}
     */
    _onNavigateToConference(conference: RecentListItem) {
        return () => this.props.dispatch(push('/conference', conference));
    }

    /**
     * Renders the conference card.
     *
     * @param {RecentListItem} conference - Conference Details.
     * @returns {ReactElement}
     */
    _renderRecentListEntry(conference: RecentListItem) {
        const title = '会议号 ：' + convertForTrans(conference.room);
        const starttime = '开始时间 ：' + this._renderStartTime(conference);
        const duration = '会议持续时间 ：' + this._renderDuration(conference);
        return (
            <ConferenceCard
                key = { conference.startTime }
                onClick = { this._onNavigateToConference(conference) }>
                <ConferenceTitle>
                    { title }
                </ConferenceTitle>
                {/* <TruncatedText>
                    { this._renderServerURL(conference.serverURL) }
                </TruncatedText> */}
                <TruncatedText>
                    { starttime }
                </TruncatedText>
                <TruncatedText>
                    { duration }
                </TruncatedText>
            </ConferenceCard>
        );
    }

    /**
     * Returns formatted Server URL.
     *
     * @param {string} serverURL - Server URL.
     * @returns {string} - Formatted server URL.
     */
    _renderServerURL(serverURL: string) {
        // Strip protocol to make it cleaner.
        return `${serverURL.replace('https://', '')}`;

    }

    /**
     * Returns the duration of the conference in string format.
     *
     * @param {RecentListItem} conference - Conference Details.
     * @returns {string} - Date/Time and Duration.
     */
    _renderDuration(conference: RecentListItem) {
        const { startTime, endTime } = conference;
        const start = moment(startTime);
        const end = moment(endTime || Date.now());

        return moment.duration(end.diff(start)).humanize();
    }

    /**
     * Returns the Date/Time of the conference in string format.
     *
     * @param {RecentListItem} conference - Conference Details.
     * @returns {string} - Date/Time and Duration.
     */
    _renderStartTime(conference: RecentListItem) {
        const { startTime } = conference;

        return moment(startTime).calendar();
    }
}

/**
 * Maps (parts of) the redux state to the React props.
 *
 * @param {Object} state - The redux state.
 * @returns {{
 *     _recentList: Array<RecentListItem>
 * }}
 */
function _mapStateToProps(state: Object) {
    return {
        _recentList: state.recentList.recentList
    };
}

export default connect(_mapStateToProps)(RecentList);
