import { useEffect, useState } from 'react'
import {useDebounce} from 'react-use'
import Search from './Search'
import Spinner from './Spinner';
import MovieCard from './MovieCard';
import { getTrendingMovies, updateSearchCount } from '../appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method:'GET',
  headers:{
    accept:'application/json',
    Authorization : `Bearer ${API_KEY}`
  }
}

const App = () => {
  
  const [search,setSearch] = useState('');
  const [errorMsg,setErrorMsg] = useState('');
  const [moviesList,setMoviesList] = useState([]);
  const [trending,setTrending] = useState([]);
  const [loading,setLoading] = useState(false);
  const [searchDebounce,setSearchDebounce] = useState('')

  useDebounce(()=>setSearchDebounce(search) ,1000,[search])

  const fetchMovies = async (query ='')=>{
    setLoading(true);
    setErrorMsg('');

    try{
      const endpoint =  query ? `${API_BASE_URL}/search/movie?query=${encodeURI(query)}` : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint,API_OPTIONS);
      if(!response.ok){
        throw new error("Failed to fetch Movies from API")
      }
      const data = await response.json();
      
      if(data.response == false){
        setErrorMsg(data.error || 'failed to fetch movies');
        setMoviesList([]);
        return;
      }
      setMoviesList(data.results || []);

      if(query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
      
    }
    catch(error){
      console.error(`Error in fetching Movies: ${error}`);
      setErrorMsg('Error Fetching Movies. Please try again later');
    }
    finally{
      setLoading(false);
    }
  }

  const loadTrend = async ()=>{
    try {
      const trend = await getTrendingMovies();
      setTrending(trend);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(()=>{
    fetchMovies(searchDebounce);
  },[searchDebounce]);

  useEffect(()=>{
    loadTrend();
  },[])

  return (
    <main>
      <div className='pattern'></div>

      <div className='wrapper'>
        <header>
          <img src="./hero.png" alt="hero" />
          <h1>Find <span className='text-gradient'>Movies</span> You'll Enjoy Without Hassle</h1>
          <Search search={search} setSearch={setSearch}/>
        </header>

        {trending.length > 0 && (
          <section className='trending'>
              <h2>Trending Movies</h2>
              <ul>
                {trending.map((movie,index)=>(
                  <li key={movie.$id}>
                    <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                  </li>
                ))}
              </ul>
          </section>
        )}

        <section className='all-movies'>
          <h2>All Movies</h2>
          {loading ? (
            <Spinner /> 
          ) : errorMsg ? (
          <p className='text-red-500'>{errorMsg}</p>
          ) : (
            <ul>
              {moviesList.map((movie)=>(
                <MovieCard key={movie.id} movie={movie}/>
              ))}
            </ul>
          )
          }
        </section>
      </div>

    </main>
  )
}

export default App