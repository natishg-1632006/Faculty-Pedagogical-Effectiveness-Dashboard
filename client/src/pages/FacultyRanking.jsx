import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Filter, Search, Download, Star, Crown, Zap, X, MessageSquare } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { hodAPI } from '../services/api';
import toast from 'react-hot-toast';
import PageHero from '../components/PageHero';
import ChartPanel from '../components/ChartPanel';

const FacultyRanking = () => {
  const [rankings, setRankings] = useState([]);
  const [filteredRankings, setFilteredRankings] = useState([]);
  const [semester, setSemester] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedFacultyDetails, setSelectedFacultyDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchRankings();
  }, [semester]);

  useEffect(() => {
    setFilteredRankings(
      rankings.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, rankings]);

  const fetchRankings = async () => {
    try {
      const { data } = await hodAPI.getFacultyRanking(semester);
      setRankings(data);
      setFilteredRankings(data);
    } catch (error) {
      toast.error('Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (faculty) => {
    setShowDetailsModal(true);
    setDetailsLoading(true);
    // Immediately set basic info to avoid UI flicker
    setSelectedFacultyDetails({ faculty: { name: faculty.name, email: faculty.email }, radarData: [], recentComments: [] });
    try {
      const { data } = await hodAPI.getFacultyDetails(faculty.facultyId);
      setSelectedFacultyDetails(data);
    } catch (error) {
      toast.error('Failed to load faculty details');
      setShowDetailsModal(false); // Close modal on error
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (rankings.length === 0) return toast.error('No data to export');
    
    const headers = ['Rank', 'Faculty Name', 'Email', 'Average Score', 'Total Reviews', 'Performance Tier'];
    const rows = rankings.map((r, idx) => [
      idx + 1,
      `"${r.name}"`,
      r.email,
      r.averageScore,
      r.feedbackCount,
      getPerformanceTier(parseFloat(r.averageScore)).label
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `faculty_rankings_${semester || 'all_semesters'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-8 h-8 text-yellow-500 drop-shadow-lg" />;
    if (index === 1) return <Medal className="w-8 h-8 text-gray-400 drop-shadow-md" />;
    if (index === 2) return <Award className="w-8 h-8 text-orange-600 drop-shadow-md" />;
    return <span className="text-xl font-bold text-gray-400 w-8 text-center">#{index + 1}</span>;
  };

  const getRankBadge = (index) => {
    if (index === 0) return 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 shadow-yellow-500/50';
    if (index === 1) return 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-gray-500/50';
    if (index === 2) return 'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-600 shadow-orange-500/50';
    return 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30';
  };

  const getPerformanceTier = (score) => {
    if (score >= 4.5) return { label: 'Elite', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400', icon: Zap };
    if (score >= 4.0) return { label: 'Excellent', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', icon: Star };
    if (score >= 3.0) return { label: 'Good', color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', icon: Award };
    return { label: 'Needs Improvement', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400', icon: Filter };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const eliteCount = rankings.filter((item) => parseFloat(item.averageScore) >= 4.5).length;
  const topScore = rankings[0]?.averageScore || 0;
  const topFaculty = filteredRankings[0] || null;
  const avgFilteredScore = filteredRankings.length
    ? (filteredRankings.reduce((sum, item) => sum + parseFloat(item.averageScore), 0) / filteredRankings.length).toFixed(2)
    : '0.00';
  const mostReviewedFaculty = [...filteredRankings].sort((a, b) => b.feedbackCount - a.feedbackCount)[0] || null;
  const needSupportCount = filteredRankings.filter((item) => parseFloat(item.averageScore) < 3).length;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Faculty Leaderboard"
        title="Review the faculty ranking with a more premium leaderboard experience."
        description="Search, filter, export, and open detailed radar insights while keeping the top performers and elite count visible."
        highlights={[
          { label: 'Total Faculty', value: rankings.length },
          { label: 'Elite Performers', value: eliteCount },
          { label: 'Top Score', value: topScore },
        ]}
      />

      <div className="glass-card p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faculty Ranking</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Performance leaderboard</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="p-2.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Export CSV"
          >
            <Download className="w-5 h-5" />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 w-48 lg:w-64 transition-all"
            />
          </div>
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card p-5 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/10 dark:to-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Filtered Average</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">{avgFilteredScore}</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Across the current search and semester filters.</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-900/10 dark:to-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Leaderboard Leader</p>
          <p className="mt-2 text-xl font-black text-gray-900 dark:text-white line-clamp-1">{topFaculty?.name || 'N/A'}</p>
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-300">{topFaculty?.averageScore || '0.00'} average score</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-violet-50/80 to-white dark:from-violet-900/10 dark:to-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Most Reviewed</p>
          <p className="mt-2 text-xl font-black text-gray-900 dark:text-white line-clamp-1">{mostReviewedFaculty?.name || 'N/A'}</p>
          <p className="mt-2 text-sm text-violet-600 dark:text-violet-300">{mostReviewedFaculty?.feedbackCount || 0} reviews</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-900/10 dark:to-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Need Support</p>
          <p className="mt-2 text-3xl font-black text-rose-600">{needSupportCount}</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Faculty below the safe ranking zone.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
        <ChartPanel title="Ranking Intelligence" subtitle="Fast insights to understand how the leaderboard is behaving right now.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/70 p-5">
              <div className="inline-flex rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                Talent Signal
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Elite Band</p>
              <p className="mt-1 text-3xl font-black text-gray-900 dark:text-white">{eliteCount}</p>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Faculty performing at 4.5 or above.</p>
            </div>
            <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/70 p-5">
              <div className="inline-flex rounded-full bg-gradient-to-r from-sky-500 to-cyan-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                Search State
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Visible Faculty</p>
              <p className="mt-1 text-3xl font-black text-gray-900 dark:text-white">{filteredRankings.length}</p>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Current results after filters and search.</p>
            </div>
            <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/70 p-5">
              <div className="inline-flex rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                Benchmark
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Top Score</p>
              <p className="mt-1 text-3xl font-black text-gray-900 dark:text-white">{topScore}</p>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Best score in the current ranking pool.</p>
            </div>
          </div>
        </ChartPanel>

        <ChartPanel title="Quick Compare Shortlist" subtitle="A cleaner shortlist for fast scan and comparison.">
          <div className="space-y-3">
            {filteredRankings.slice(0, 4).map((faculty, index) => {
              const tier = getPerformanceTier(parseFloat(faculty.averageScore));
              return (
                <div key={faculty.facultyId} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl ${getRankBadge(index)} flex items-center justify-center text-white font-bold shadow-sm`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{faculty.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{faculty.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-gray-900 dark:text-white">{faculty.averageScore}</p>
                      <p className="text-xs text-gray-500">{faculty.feedbackCount} reviews</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tier.color}`}>
                      <tier.icon className="w-3 h-3" />
                      {tier.label}
                    </div>
                    <button
                      onClick={() => handleViewDetails(faculty)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartPanel>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-start">
        {filteredRankings.slice(0, 3).map((faculty, index) => (
          <motion.div
            key={faculty.facultyId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-card p-6 text-center relative overflow-hidden group ${
              index === 0 ? 'md:order-2 transform md:scale-110 border-yellow-200 dark:border-yellow-900 shadow-xl z-10' : 
              index === 1 ? 'md:order-1 border-gray-200 dark:border-gray-700 md:mt-12' : 'md:order-3 border-orange-200 dark:border-orange-900 md:mt-24'
            }`}
          >
            {/* Background Gradient Effect */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${getRankBadge(index).split(' ')[1]}`} />
            
            <div className="flex justify-center mb-4 relative z-10">
              {getRankIcon(index)}
            </div>
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full ${getRankBadge(index)} shadow-lg flex items-center justify-center text-white text-2xl font-bold relative z-10 ring-4 ring-white dark:ring-gray-800`}>
              {faculty.name.charAt(0)}
            </div>
            <h3 className="text-xl font-bold mb-1 truncate">{faculty.name}</h3>
            <div className="text-4xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">{faculty.averageScore}</div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
              <Star className="w-3 h-3 fill-current" />
              {faculty.feedbackCount} Reviews
            </div>
          </motion.div>
        ))}
      </div>

      {/* Full Rankings Table */}
      <div className="glass-card p-6 overflow-hidden">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-blue-600" />
          Leaderboard
        </h2>
        <div className="space-y-3">
          {filteredRankings.map((faculty, index) => {
            const tier = getPerformanceTier(parseFloat(faculty.averageScore));
            const TierIcon = tier.icon;
            
            return (
            <motion.div
              key={faculty.facultyId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all group cursor-pointer"
              onClick={() => handleViewDetails(faculty)}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-8 flex justify-center flex-shrink-0">
                {index < 3 ? (
                  getRankIcon(index)
                ) : (
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                )}
              </div>
                <div className={`w-10 h-10 rounded-full ${getRankBadge(index)} flex items-center justify-center text-white font-bold shadow-sm`}>
                {faculty.name.charAt(0)}
              </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{faculty.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{faculty.email}</p>
              </div>
              </div>

              <div className="flex items-center gap-6 justify-between md:justify-end w-full md:w-auto mt-2 md:mt-0 pl-14 md:pl-0">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tier.color}`}>
                  <TierIcon className="w-3 h-3" />
                  {tier.label}
                </div>

                <div className="w-32 hidden sm:block">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                    style={{ width: `${(faculty.averageScore / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

                <div className="text-right min-w-[80px]">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{faculty.averageScore}</div>
                  <div className="text-xs text-gray-500 mt-1">{faculty.feedbackCount} reviews</div>
                </div>
              </div>
            </motion.div>
          );
        })}
        </div>

        {filteredRankings.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
            No rankings available yet
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{selectedFacultyDetails?.faculty.name}</h2>
                <p className="text-sm text-gray-500">{selectedFacultyDetails?.faculty.email}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {detailsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Performance Radar</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={selectedFacultyDetails?.radarData}>
                          <PolarGrid stroke="#9ca3af" strokeOpacity={0.2} />
                          <PolarAngleAxis dataKey="parameter" tick={{ fill: '#6b7280', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                          <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Comments</h3>
                    <div className="space-y-3">
                      {selectedFacultyDetails?.recentComments.length > 0 ? (
                        selectedFacultyDetails.recentComments.map((c, i) => (
                          <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{c.comment}"</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-gray-500">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          No comments available.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      </div>
    
  );
};

export default FacultyRanking;
